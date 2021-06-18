const fs = require('fs');

const CHARACTER_CLASSES = [
    'Barbarian',
    'Crusader',
    'DemonHunter',
    'Monk',
    'Necromancer',
    'WitchDoctor',
    'Wizard'
];
const ITEM_TYPES = [
    'Weapon',
    'Armor',
    'Jewelry'
];

let data = new Map();

function getRawFileContents() {
	const filename = 'rawItems.txt';
	
	return fs.readFileSync(filename, 'utf8');
}

function writeJSONFile() {
	const filename = 'allItems.json';
	const items = [];

	data.forEach((value, key, map) => {
		items.push({
			id: key,
			name: value.name,
			type: value.type,
			classes: value.classes
		});
	});
	
	fs.writeFileSync(filename, JSON.stringify({ items: items }, null, 4));
}

const rawContents = getRawFileContents();
const lines = rawContents.split('\r\n');

let currentClass;
let currentType;

for (const line of lines) {
	if (!line) {
		continue;
	}
	
	if (CHARACTER_CLASSES.includes(line)) {
		const oldClass = currentClass;
		
		currentClass = line;
		currentType = null;
		
		if (!oldClass) {
			console.log(`Starting with ${currentClass}.`);
		} else {
			console.log(`Switching from ${oldClass} to ${currentClass}.`);
		}
		
		continue;
	}
	
	if (ITEM_TYPES.includes(line)) {
		const oldType = currentType;
		
		currentType = line;
		
		if (!oldType) {
			console.log(`Starting with ${currentClass} ${currentType}.`);
		} else {
			console.log(`Switching from ${currentClass} ${oldType} to ${currentClass} ${currentType}.`);
		}
		
		continue;
	}
	
	// Process the currentClass/currentType
	const id = makeId(line);
	let existing = data.get(id);
	
	if (!existing) {
		existing = {
			id,
			name: line,
			type: currentType,
			classes: []
		}
	}
	
	if (existing.classes.length < CHARACTER_CLASSES.length - 1) {
		existing.classes.push(currentClass);
	} else {
		existing.classes = ['All'];
	}
	
	data.set(id, existing);
}

function makeId(value) {
	let retVal = value;
	
	retVal = retVal.replace(/[-\.\s',]/g, "");
	
	return retVal.toLowerCase();
}

writeJSONFile();

console.log(`Read in ${lines.length} lines.`);
console.log('Complete!');