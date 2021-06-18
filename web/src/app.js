'use strict';

import '@babel/polyfill';
import 'bootstrap';

import { ALL_IDENTIFIER, CHARACTER_CLASSES } from './characterClasses';
import { ITEM_TYPES } from './itemTypes';
import { getItems, saveItems } from './items';

const ACTIVE_CLASSNAME = 'active';
const OWNED_ITEM_CLASS = 'btn-success';
const NOT_OWNED_ITEM_CLASS = 'btn-danger'
const SELECT_BUTTON_CLASS = 'btn btn-outline-dark text-nowrap';
const ALL_CLASSES_VALUE = 'All Classes';
const TOOLTIP_SEPARATOR = '<br/>';
const SELECT_BUTTON_PREFIX = 'select'
const TOGGLE_BUTTON_PREFIX = 'toggle'

let classItemCounts = new Map();
let selectedCharacterClass;
let selectedItemType;

const classesElement = $('#classes');
const itemTypesElement = $('#itemTypes');
const itemsElement = $('#items');

function selectClass(value) {
    CHARACTER_CLASSES.forEach(characterClass => {
        const buttonElement = $(`#${SELECT_BUTTON_PREFIX}${characterClass.id}`);
        const isSelected = value.id === characterClass.id;

        if (isSelected) {
            buttonElement.addClass(ACTIVE_CLASSNAME);
        } else {
            buttonElement.removeClass(ACTIVE_CLASSNAME);
        }
    });
    
    selectedCharacterClass = value;
    loadCube();
}

function selectItemType(value) {
    ITEM_TYPES.forEach(itemType => {
        const buttonElement = $(`#${SELECT_BUTTON_PREFIX}${itemType.id}`);
        const isSelected = value.id === itemType.id;

        if (isSelected) {
            buttonElement.addClass(ACTIVE_CLASSNAME);
        } else {
            buttonElement.removeClass(ACTIVE_CLASSNAME);
        }
    });

    selectedItemType = value;
    loadCube();
}

function updateItemCountIndicators() {
    CHARACTER_CLASSES.forEach(characterClass => {
        const buttonElement = $(`#${SELECT_BUTTON_PREFIX}${characterClass.id}`);
        const classItemCount = classItemCounts.get(characterClass.id);
        const owned = classItemCount ? classItemCount.owned : 0;
        const total = classItemCount ? classItemCount.total : 0;        

        if (buttonElement) {
            const percent = Math.floor((owned / total) * 100);
            buttonElement.html(`${characterClass.name}<br/>${owned}/${total} (${percent}%)`);
        }
    });
}

function toggleItem(item) {
    getItems().forEach((value, key, map) => {
        const buttonElement = $(`#${TOGGLE_BUTTON_PREFIX}${value.id}`);

        if (buttonElement && item.id === key) {
            const offset = value.owned ? -1 : 1;

            // TODO:  Optimize this.
            value.classes.forEach(cls => {
                let existing = classItemCounts.get(cls);
    
                if (!existing) {
                    existing = {
                        owned: 0,
                        total: 0
                    };
                }
    
                existing.owned += offset;
                classItemCounts.set(cls, existing);
            });

            let existingAll = classItemCounts.get(ALL_IDENTIFIER);

            if (!existingAll) {
                existingAll = {
                    owned: 0,
                    total: 0
                };
            }

            existingAll.owned += offset;
            classItemCounts.set(ALL_IDENTIFIER, existingAll);

            value.owned = !value.owned;

            updateItemCountIndicators();
            updateItemToggleState(buttonElement, value.owned);
            saveItems();
            return;
        }
    });
}

function updateItemToggleState(element, owned) {
    if (owned) {
        element.addClass(OWNED_ITEM_CLASS);
        element.removeClass(NOT_OWNED_ITEM_CLASS);
    } else {
        element.addClass(NOT_OWNED_ITEM_CLASS);
        element.removeClass(OWNED_ITEM_CLASS);
    }
}

function loadCube() {
    itemsElement.html('');
    // TODO:  Optimize this.
    classItemCounts.clear();

    if (!selectedCharacterClass || !selectedItemType) {
        return;
    }

    console.log(`Loading data for ${selectedCharacterClass.name} ${selectedItemType.name}`);

    let columnIndex = 0;
    let currentRowElement;
    let noItemsToDisplay = true;

    getItems().forEach((value, key, map) => {
        // TODO:  Optimize this.
        value.classes.forEach(cls => {
            let existing = classItemCounts.get(cls);

            if (!existing) {
                existing = {
                    owned: 0,
                    total: 0
                };
            }

            if (value.owned) {
                existing.owned++;
            }

            existing.total++;
            classItemCounts.set(cls, existing);
        });

        let existingAll = classItemCounts.get(ALL_IDENTIFIER);

        if (!existingAll) {
            existingAll = {
                owned: 0,
                total: 0
            };
        }

        if (value.owned) {
            existingAll.owned++;
        }

        existingAll.total++;
        classItemCounts.set(ALL_IDENTIFIER, existingAll);

        const showMissingOnly = $('#showOnlyMissingItems').is(':checked');

        if ((selectedCharacterClass.id === ALL_IDENTIFIER || value.classes.includes(selectedCharacterClass.id))
            && value.type === selectedItemType.id && ((showMissingOnly && !value.owned) || !showMissingOnly)) {
            noItemsToDisplay = false;

            if (columnIndex > 2) {
                if (currentRowElement) {
                    itemsElement.append(currentRowElement);
                }

                currentRowElement = null;
                columnIndex = 0;
            }

            if (!currentRowElement) {
                currentRowElement = $('<div>');
                currentRowElement.attr('class', 'row flex-nowrap');
            }
            
            const columnElement = $('<div>');

            columnElement.attr('class', 'col-4 p-0');

            const buttonElement = $('<button>');

            buttonElement.attr('id', `${TOGGLE_BUTTON_PREFIX}${key}`);
            buttonElement.attr('class', 'btn w-100 item-button');

            if (value.classes.length === 1) {
                buttonElement.addClass('class-specific');
            }

            buttonElement.attr('data-toggle', 'tooltip');
            buttonElement.attr('data-html', 'true');
            buttonElement.attr('data-placement', 'right');
            buttonElement.attr('title', `<b>Available To</b><hr/><div>${getClassesString(value.classes)}</div>`);
            buttonElement.text(value.name);
            buttonElement.on('click', () => {
                toggleItem(value)
            });

            updateItemToggleState(buttonElement, value.owned);
            columnElement.append(buttonElement);
            currentRowElement.append(columnElement);
            buttonElement.tooltip();
            columnIndex++;
        }
    });

    if (!noItemsToDisplay) {
        if (currentRowElement) {
            for (let index = columnIndex; index < 3; index++) {
                const columnElement = $('<div>');

                columnElement.attr('class', 'col-4 p-0');
                
                const buttonElement = $('<button>');

                buttonElement.attr('class', 'btn w-100 item-button btn-dark');
                buttonElement.attr('disabled', 'true');

                columnElement.append(buttonElement);
                currentRowElement.append(columnElement);
            }

            itemsElement.append(currentRowElement);
        }
    } else {
        currentRowElement = $('<div>');
        currentRowElement.attr('class', 'row flex-nowrap');

        const columnElement = $('<div>');

        columnElement.attr('class', 'col p-0 text-center complete-section');
        columnElement.html('You appear to have all of the items in this section!');
        
        currentRowElement.append(columnElement);
        itemsElement.append(currentRowElement);
    }

    updateItemCountIndicators();
}

function getClassesString(classes) {
    let classNames = [];

    if (classes && classes.length) {
        if (classes.length !== CHARACTER_CLASSES.length - 1) {
            classes.forEach(cls => {
                for (const index in CHARACTER_CLASSES) {
                    const characterClass = CHARACTER_CLASSES[index];

                    if (characterClass.id !== ALL_IDENTIFIER && characterClass.id === cls) {
                        classNames.push(characterClass.name);
                        break;
                    }
                }
            });
        } else {
            classNames.push(ALL_CLASSES_VALUE);
        }
    }

    return classNames.join(TOOLTIP_SEPARATOR);
}

function initCharacterClasses() {
    CHARACTER_CLASSES.forEach(characterClass => {
        const buttonElement = $('<button>');

        buttonElement.attr('id', `${SELECT_BUTTON_PREFIX}${characterClass.id}`);
        buttonElement.attr('class', SELECT_BUTTON_CLASS);
        buttonElement.text(characterClass.name);
        buttonElement.on('click', () => {
            selectClass(characterClass)
        });

        classesElement.append(buttonElement);
    });
}

function initItemTypes() {
    const rowElement = $('<div>');

    rowElement.attr('class', 'row flex-nowrap justify-content-center');

    ITEM_TYPES.forEach(itemType => {
        const buttonElement = $('<button>');

        buttonElement.attr('id', `${SELECT_BUTTON_PREFIX}${itemType.id}`);
        buttonElement.attr('class', SELECT_BUTTON_CLASS);
        buttonElement.text(itemType.name);
        buttonElement.on('click', () => {
            selectItemType(itemType)
        });

        rowElement.append(buttonElement);
    });

    itemTypesElement.append(rowElement);
}

initCharacterClasses();
initItemTypes();

const selectAllElement = $('#selectAll');
const selectWeaponElement = $('#selectWeapon');
const showOnlyMissingItemsElement = $('#showOnlyMissingItems');

selectAllElement.click();
selectWeaponElement.click();
showOnlyMissingItemsElement.on('click', (event) => {
    loadCube();
});