// Copyright (c) 2018 LG Electronics, Inc.
// SPDX-License-Identifier: LicenseRef-EnactBrowser-Evaluation
//
// You may not use this content except in compliance with the License.
// You may obtain a copy of the License at
//
// https://github.com/webosose/com.webos.app.enactbrowser/blob/master/LICENSE

import {TabTypes} from './TabsConsts';

class RecentlyClosedSites {
    constructor(storage, tabs, maxTabsToStore = 10) {
        this.storage = storage;
        this.maxTabsToStore = maxTabsToStore;
        this.count = null;
        this.earliestId = null;
        tabs.addEventListener('delete', this.handleTabDelete);
        tabs.addEventListener('replace', this.handleTabReplace);
    }

    initialize() {
        this.storage.getAll().then((result) => {
            this.count = result.length;
            return Promise.resolve(result);
        });
    }

    getAll() {
        return this.storage.getAll();
    }

    remove(id) {
        this.storage.remove(id).then((result) => {
            this.count--;
            return Promise.resolve(result);
        });
    }

    removeAll() {
        this.count = 0;
        return this.storage.removeAll();
    }

    _addEntry(entry) {
        let promise;
        if (this.count >= this.maxTabsToStore) {
            promise = this.storage.removeFirst();
        }
        else {
            this.count++;
            promise = Promise.resolve();
        }
        promise.then(() => {
            return this.storage.add(entry);
        });
    }

    handleTabDelete = (ev) => {
        if (ev.state.type === TabTypes.WEBVIEW) {
            this._addEntry({
                url: ev.state.navState.url,
                title: ev.state.title
            });
        }
    }

    handleTabReplace = (ev) => {
        if (ev.oldState.type === TabTypes.WEBVIEW) {
            this._addEntry({
                url: ev.oldState.navState.url,
                title: ev.oldState.title
            });
        }
    }
}

export default RecentlyClosedSites;
export {RecentlyClosedSites};