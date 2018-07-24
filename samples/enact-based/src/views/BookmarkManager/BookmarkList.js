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
 * Contains the declaration for the BookmarkList component.
 *
 */

import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import React, {Component} from 'react';
import Spotlight from '@enact/spotlight';

import BookmarkItem from './BookmarkItem';
import Sortable from '../../components/Sortable';
import {moveBookmarkSelected, deselectAllBookmarks} from '../../actions';

import css from './BookmarkList.less';

const placeholder = (typeof document === 'object') ? document.createElement('li') : null;

if (placeholder) {
	placeholder.setAttribute('style', 'display: flex; width: 1530px; margin-right: 21px; padding: 6px; background-color: white; opacity: 0.6; border: dotted 2px grey;');
	placeholder.innerHTML = 'drop here';
}

class BookmarkListBase extends Component {
	static propTypes = {
		browser: PropTypes.any,
		component: PropTypes.any,
		data: PropTypes.array,
		moveBookmarkSelected: PropTypes.func
	}

	onClick = (ev) => {
		const
			{browser, data} = this.props,
			i = ev.currentTarget.dataset.index;

		if (!isNaN(i)) {
			const url = data[i].url;
			browser.navigate(url);
			Spotlight.pause();
			this.props.deselectAllBookmarks();
		}
	}

	onMove = (fromIndex, toIndex) => {
		this.props.browser.bookmarks.moveBookmark(fromIndex, toIndex);
		this.props.moveBookmarkSelected(fromIndex, toIndex);
	}

	bookmarks = () => {
		const
			{component: Item, data} = this.props,
			items = [];

		for (let i = 0; i < data.length; i++) {
			items.push(
				<Item
					data-id={i}
					index={i}
					key={i}
					title={data[i].title}
					onClick={this.onClick}
					url={data[i].url}
				/>
			);
		}

		return items;
	}

	render () {
		const props = Object.assign({}, this.props);
		delete props.browser;
		delete props.component;
		delete props.data;
		delete props.moveBookmarkSelected;
		delete props.deselectAllBookmarks;

		return (
			<ul {...props} className={css.bookmarkList}>
				{this.bookmarks()}
			</ul>
		);
	}
}

const SortableBookmarkList = Sortable({component: BookmarkItem, placeholder}, BookmarkListBase);

const mapStateToProps = ({bookmarksState}) => ({
	data: bookmarksState.data
});

const mapDispatchToProps = (dispatch) => ({
	moveBookmarkSelected: (fromIndex, toIndex) => dispatch(moveBookmarkSelected(fromIndex, toIndex)),
	deselectAllBookmarks: () => dispatch(deselectAllBookmarks())
});

const BookmarkList = connect(mapStateToProps, mapDispatchToProps)(SortableBookmarkList);

export default BookmarkList;
export {BookmarkList};