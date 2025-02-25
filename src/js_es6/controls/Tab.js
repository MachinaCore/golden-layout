import DragListener from '../utils/DragListener'
import DragProxy from '../controls/DragProxy'
import {
    fnBind,
    stripTags
} from '../utils/utils'


/**
 * Represents an individual tab within a Stack's header
 *
 * @param {Header} header
 * @param {AbstractContentItem} contentItem
 *
 * @constructor
 */

export default class Tab {

    constructor(header, contentItem, layoutManager) {
      let template = '<li class="lm_tab"><i class="lm_left"></i>' +
      '<span class="lm_title"></span><div class="lm_close_tab"></div>' +
      '<i class="lm_right"></i></li>';

        this.layoutManager = layoutManager;
        this.header = header;
        this.contentItem = contentItem;

        if(this.layoutManager.config.templates.tab) {
          template = this.layoutManager.config.templates.tab;
        }

        this.element = $(template);
        this.titleElement = this.element.find('.lm_title');
        this.closeElement = this.element.find('.lm_close_tab');
        this.closeElement[contentItem.config.isClosable ? 'show' : 'hide']();
        this.isActive = false;

        this.setTitle(contentItem.config.title);
        this.contentItem.on('titleChanged', this.setTitle, this);

        this._layoutManager = this.contentItem.layoutManager;

        if (
            this._layoutManager.config.settings.reorderEnabled === true &&
            contentItem.config.reorderEnabled === true
        ) {
            this._dragListener = new DragListener(this.element);
            this._dragListener.on('dragStart', this._onDragStart, this);
            this.contentItem.on('destroy', this._dragListener.destroy, this._dragListener);
        }

        this._onTabClickFn = fnBind(this._onTabClick, this);
        this._onCloseClickFn = fnBind(this._onCloseClick, this);

        this.element.on('mousedown touchstart', this._onTabClickFn);

        if (this.contentItem.config.isClosable) {
            this.closeElement.on('click touchstart', this._onCloseClickFn);
            this.closeElement.on('mousedown', this._onCloseMousedown);
        } else {
            this.closeElement.remove();
        }

        this.contentItem.tab = this;
        this.contentItem.emit('tab', this);
        this.contentItem.layoutManager.emit('tabCreated', this);

        if (this.contentItem.isComponent) {
            this.contentItem.container.tab = this;
            this.contentItem.container.emit('tab', this);
        }
    }


    /**
     * Sets the tab's title to the provided string and sets
     * its title attribute to a pure text representation (without
     * html tags) of the same string.
     *
     * @public
     * @param {String} title can contain html
     */
    setTitle(title) {
        this.element.attr('title', stripTags(title));
        this.titleElement.html(title);
    }

    /**
     * Sets this tab's active state. To programmatically
     * switch tabs, use header.setActiveContentItem( item ) instead.
     *
     * @public
     * @param {Boolean} isActive
     */
    setActive(isActive) {
        if (isActive === this.isActive) {
            return;
        }
        this.isActive = isActive;

        if (isActive) {
            this.element.addClass('lm_active');
        } else {
            this.element.removeClass('lm_active');
        }
    }

    /**
     * Destroys the tab
     *
     * @private
     * @returns {void}
     */
    _$destroy() {
        this.element.off('mousedown touchstart', this._onTabClickFn);
        this.closeElement.off('click touchstart', this._onCloseClickFn);
        if (this._dragListener) {
            this.contentItem.off('destroy', this._dragListener.destroy, this._dragListener);
            this._dragListener.off('dragStart', this._onDragStart);
            this._dragListener = null;
        }
        this.element.remove();
    }

    /**
     * Callback for the DragListener
     *
     * @param   {Number} x The tabs absolute x position
     * @param   {Number} y The tabs absolute y position
     *
     * @private
     * @returns {void}
     */
    _onDragStart(x, y) {
        if (!this.header._canDestroy)
            return null;
        if (this.contentItem.parent.isMaximised === true) {
            this.contentItem.parent.toggleMaximise();
        }
        new DragProxy(
            x,
            y,
            this._dragListener,
            this._layoutManager,
            this.contentItem,
            this.header.parent
        );
    }

    /**
     * Callback when the tab is clicked
     *
     * @param {jQuery DOM event} event
     *
     * @private
     * @returns {void}
     */
    _onTabClick(event) {
        // left mouse button or tap
        if (event.button === 0 || event.type === 'touchstart') {
            this.header.parent.setActiveContentItem( this.contentItem );

            // middle mouse button
        } else if (event.button === 1 && this.contentItem.config.isClosable) {
            this._onCloseClick(event);
        }
    }

    /**
     * Callback when the tab's close button is
     * clicked
     *
     * @param   {jQuery DOM event} event
     *
     * @private
     * @returns {void}
     */
    _onCloseClick(event) {
        event.stopPropagation();
        if (!this.header._canDestroy)
            return;
        this.header.parent.removeChild(this.contentItem);
		this.header._updateTabSizes();
    }

    /**
     * Callback to capture tab close button mousedown
     * to prevent tab from activating.
     *
     * @param (jQuery DOM event) event
     *
     * @private
     * @returns {void}
     */
    _onCloseMousedown(event) {
        event.stopPropagation();
    }
}
