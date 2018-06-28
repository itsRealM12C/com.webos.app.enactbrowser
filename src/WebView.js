/*global window*/
import {EventEmitter} from './Utilities';

class WebviewMessageProxy {
    constructor() {
        this.counter = 0;
        this.requests = {};
        window.addEventListener('message', this.handleWebviewMessage);
    }

    sendMessage(webview, message, callback) {
        let data = Object.assign({id: this.counter.toString()}, message);
        this.requests[data.id] = {webview, callback};
        this.counter++;
        webview.contentWindow.postMessage(JSON.stringify(data), '*');
    }

    handleWebviewMessage = (ev) => {
        if (ev.data) {
            const data = JSON.parse(ev.data);
            this.requests[data.id].callback(data);
            delete this.requests[data.id];
        } else {
            console.warn('Warning: Message from guest contains no data');
        }
    }
}

let msgProxy = null;

// webview wrapper, which handles some code boilerplate
// events:
// navStateChanged (new nav state)
// newTabRequest
class WebView extends EventEmitter {
    constructor({activeState, ...rest}) {
        super();
        if (!msgProxy) { // initializing global object, as it uses window
            msgProxy = new WebviewMessageProxy();
        }
        this.webView = document.createElement('webview');
        this._scriptInjectionAttempted = false;
        this.rootId = null;
        this.activeState = activeState;
        // This code handles specific behavior of React
        // If we create webview and assign properties to it before first app render finished
        // this properties will be overwritten after this render
        if (this._isWebViewLoaded()) {
            this._initWebView(rest);
        }
        else {
            document.addEventListener('DOMContentLoaded', () => { this._initWebView(params); });
        }
    }

    // Shoud be called when DOM is ready
    insertIntoDom(rootId) {
        this.rootId = rootId;
        if (this.activeState === 'activated') {
            document.getElementById(rootId).appendChild(this.webView);
        }
    }

    activate() {
        if (this.activeState === 'deactivated' && this.rootId) {
            document.getElementById(this.rootId).appendChild(this.webView);
        }
        else if (this.activeState === 'suspended' && this.webView.resume) {
            this.webView.resume();
        }
        this.activeState = 'activated';
    }

    suspend() {
        if (this.activeState === 'activated') {
            if (this.webView.suspend) {
               this.webView.suspend();
            }
            else {
                console.warn('Suspend/resume extension is not implemeted');
            }
            this.activeState = 'suspended';
        }
        else if (this.activeState === 'deactivated') {
            console.error('Can\'t suspend webview from deactivated state');
        }
    }

    deactivate() {
        if (this.activeState !== 'deactivated') {
            document.getElementById(this.rootId).removeChild(this.webView);
            this.activeState = 'deactivated';
        }
    }

    navigate(url) {
        this.webView.src = url;
    }

    reloadStop() {
        if (this.isLoading) {
            this.webView.stop();
        }
        else {
            this.webView.reload();
        }
    }

    back() {
        if (this.webView.canGoBack()) {
            this.webView.back();
        }
    }

    forward() {
        if (this.webView.canGoForward()) {
            this.webView.forward();
        }
    }

    setZoom(zoomFactor) {
        this.webView.setZoom(zoomFactor);
    }

    captureVisibleRegion(params) {
        return new Promise((resolve) => {
            this.webView.captureVisibleRegion(params, (dataUrl) => {
                resolve(dataUrl);
            });
        });
    }

    getNavState() {
        return {
            canGoBack: this.webView.canGoBack(),
            canGoForward: this.webView.canGoForward(),
            isLoading: this.isLoading,
            url: this.url
        };
    }

    // Clears browsing data for the webview partition
    clearData(options, types) {
        return new Promise((resolve) => {
            this.webView.clearData(options, types, () => {
                resolve();
            });
        });
    }

    _isWebViewLoaded() {
        return this.webView && Object.getOwnPropertyNames(this.webView).length !== 0;
    }

    _initWebView(params) {
        this.url = params.url ? params.url : '';
        this.isLoading = false;
        // partition assignment shoud be before any assignment of src
        this.webView.partition = params.partition ? params.partition : '';
        this.webView.src = this.url;
        this.webView.addEventListener('loadstart', this.handleLoadStart);
        this.webView.addEventListener('loadcommit', this.handleLoadCommit);
        this.webView.addEventListener('loadstop', this.handleLoadStop);
        this.webView.addEventListener('loadabort', this.handleLoadAbort);
        this.webView.addEventListener('newwindow', this.handleNewWindow);
        this.webView.addEventListener('permissionrequest', this.handleNewWindow);
        this.webView.setZoom(params.zoomFactor ? params.zoomFactor : 1);
    }

    handleLoadStart = (ev) => {
        if (ev.isTopLevel) {
            if (this.url !== ev.url) {
                this._scriptInjectionAttempted = false;
                this.emitEvent('titleChange', {title: ev.url});
            }
            this.url = ev.url;
            this.isLoading = true;
            this.emitEvent('navStateChanged', this.getNavState());
        }
    }

    handleLoadCommit = (ev) => {
        if (ev.isTopLevel && !this._scriptInjectionAttempted) {
            // Try to inject title-update-messaging script
            this.webView.executeScript(
                {'file': 'resources/label.js'},
                this.handleWebviewLabelScriptInjected
            );
            this._scriptInjectionAttempted = true;
        }
        if (ev.isTopLevel && this.url !== ev.url) {
            this.url = ev.url;
            this.emitEvent('navStateChanged', this.getNavState());
        }
    }

    handleLoadStop = () => {
        this.isLoading = false;
        this.emitEvent('navStateChanged', this.getNavState());
    }

    handleLoadAbort = (ev) => {
        ev.preventDefault();
        if (ev.isTopLevel) {
            const reason = ev.reason;
            this.emitEvent('loadAbort', {reason});
        }
        else {
            console.warn("The load has aborted with error " + ev.code + " : " + ev.reason + ' url = ' + ev.url);
        }
    }

    handlePermissionRequest = () => {
        console.warn("Permission request recieved");
    }

    handleNewWindow = (ev)  => {
        ev.preventDefault();

        const disposition = ev.windowOpenDisposition;
        if (disposition == 'new_background_tab' || disposition == 'new_foreground_tab') {
            this.emitEvent('newTabRequest', ev);
        }
    }

    handleWebviewLabelScriptInjected = (results) => {
        if (chrome.runtime.lastError) {
            console.warn('Warning: Failed to inject title.js : ' + chrome.runtime.lastError.message);
        } else if (!results || !results.length) {
            console.warn('Warning: Failed to inject title.js results are empty');
        } else {
            // Send a message to the webView so it can get a reference to
            // the embedder
            const obj = this;
            msgProxy.sendMessage(this.webView, {}, (data) => {
                if (data.title !== '[no title]') {
                    obj.emitEvent('titleChange', {title: data.title});
                }
                else {
                    console.warn(
                        'Warning: Expected message from guest to contain {title}, but got:',
                        data);
                }
            });
        }
    }
}

export default WebView;