// Copyright (c) 2018 LG Electronics, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Contains the declaration for the ZoomControl component.
 *
 */

import {connect} from 'react-redux';
import ContextualPopupDecorator from '@enact/moonstone/ContextualPopupDecorator';
import Picker from '@enact/moonstone/Picker'
import React, {Component} from 'react';

import BrowserIconButton from '../BrowserIconButton';
import {TabTypes} from '../../NevaLib/BrowserModel';

import css from './ZoomControl.less';

const ZoomPopupButton = ContextualPopupDecorator(BrowserIconButton);

const
	zoomLabels = [
		'300%',
		'250%',
		'200%',
		'150%',
		'125%',
		'100%',
		'75%'
	],
	zoomFactors = [
		3,
		2.5,
		2,
		1.5,
		1.25,
		1,
		0.75
	];

class ZoomControlBase extends Component {
	constructor (props) {
		super(props);
		this.state = {
			isOpened: false,
			zoom: zoomFactors.indexOf(1)
		}
	}

	renderPopup = () => (
		<div>
			<Picker
				incrementIcon="plus"
				decrementIcon="minus"
				orientation="vertical"
				width={6}
				onChange={this.onChange}
				value={this.state.zoom}
			>
				{zoomLabels}
			</Picker>
		</div>
	)

	onChange = (ev) => {
		this.props.browser.setZoom(zoomFactors[ev.value]);
		this.setState({zoom: ev.value});
	}

	toggleMenu = () => {
		const isOpened = !this.state.isOpened;
		setTimeout(()=> {this.setState({isOpened});}, 100);
	}

	closeMenu = () => {
		this.setState({isOpened: false});
	}

	render () {
		const props = Object.assign({}, this.props);
		delete props.browser;
		delete props.dispatch;

		return (
			<ZoomPopupButton
				backgroundOpacity="transparent"
				className={css.zoomButton}
				tooltipText="Zoom"
				open={this.state.isOpened}
				direction="down"
				popupComponent={this.renderPopup}
				onClick={this.toggleMenu}
				onClose={this.closeMenu}
				type="zoomButton"
				{...props}
			/>
		);
	}
}

const mapStateToProps = ({tabsState}) => {
	const {selectedIndex, ids, tabs} = tabsState;

	if (ids.length > 0) {
		return {
			disabled: (tabs[ids[selectedIndex]].type !== TabTypes.WEBVIEW)
		}
	} else {
		return {
			disabled: true
		};
	}
}

const ZoomControl = connect(mapStateToProps, null)(ZoomControlBase);

export default ZoomControl;
