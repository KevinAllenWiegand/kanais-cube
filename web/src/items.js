'use strict';

import _ from 'lodash';
import allItems from './data/allItems.json';
import { CHARACTER_CLASSES, ALL_IDENTIFIER } from './characterClasses';

const ITEMS_KEY = 'owned.items';
const DEFAULT_ITEMS = '{ \"items\": [] }';
const ALL_ITEMS = new Map();

let itemData = new Map();

function initItems() {
    const effectiveCharacterClasses = [];

    for (const index in CHARACTER_CLASSES) {
        const characterClass = CHARACTER_CLASSES[index];

        if (characterClass.id === ALL_IDENTIFIER) {
            continue;
        }

        effectiveCharacterClasses.push(characterClass.id);
    }

    allItems.items.forEach(item => {
        if (item && item.id && item.classes && item.classes.length) {
            const classes = item.classes && item.classes.length === 1 && item.classes[0] === ALL_IDENTIFIER
                ? effectiveCharacterClasses
                : removeBadClasses(effectiveCharacterClasses, item.classes);

            if (classes.length > 0) {
                ALL_ITEMS.set(item.id, {
                    name: item.name,
                    type: item.type,
                    classes: classes,
                });
            } else {
                if (effectiveCharacterClasses) {

                }
            }
        }
    });
}

function removeBadClasses(effectiveCharacterClasses, classes) {
    const validClasses = [];

    if (effectiveCharacterClasses && effectiveCharacterClasses.length && classes && classes.length) {
        classes.forEach(cls => {
            if (effectiveCharacterClasses.includes(cls)) {
                validClasses.push(cls);
            }
        });
    }

    return validClasses;
}

function getItems() {
    if (itemData.size === 0) {
        const storedItemData = new Map();
        const deserialized = JSON.parse(window.localStorage.getItem(ITEMS_KEY) || DEFAULT_ITEMS);
    
        if (deserialized) {
            deserialized.items.forEach(item => {
                storedItemData.set(item.id, { owned: item.owned });
            });
        }
    
        ALL_ITEMS.forEach((value, key, map) => {
            if (key) {
                const storedItem = storedItemData.get(key);
        
                itemData.set(key, {
                    id: key,
                    name: value.name,
                    type: value.type,
                    classes: value.classes,
                    owned: storedItem && storedItem.owned
                });
            }
        });

        // TODO:  Is this actually correct?  Seems to be for now...
        itemData = new Map([...itemData.entries()].sort());
    }

    return itemData;
}

let timeoutObject;

function saveItems() {
    window.clearTimeout(timeoutObject);
    timeoutObject = window.setTimeout(saveItemsImpl, 500);
}

function saveItemsImpl() {
    const serializable = [];

    itemData.forEach((value, key, map) => {
        if (value.owned) {
            serializable.push({
                id: key,
                owned: true
            });
        }
    });

    if (serializable.length > 0) {
        window.localStorage.setItem(ITEMS_KEY, JSON.stringify({ items: serializable }));
    } else {
        window.localStorage.removeItem(ITEMS_KEY);
    }
}

initItems();

export {
    getItems,
    saveItems
}