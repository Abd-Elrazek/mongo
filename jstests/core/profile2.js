// Tests that large queries and updates are properly profiled.

// Special db so that it can be run in parallel tests.
// @tags: [requires_profiling]

var coll = db.getSisterDB("profile2").profile2;

assert.commandWorked(coll.getDB().runCommand({profile: 0}));
coll.drop();
coll.getDB().system.profile.drop();
assert.commandWorked(coll.getDB().runCommand({profile: 2}));

var str = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
var hugeStr = str;
while (hugeStr.length < 2 * 1024 * 1024) {
    hugeStr += str;
}

// Test query with large string element.
coll.find({a: hugeStr}).itcount();
var results = coll.getDB().system.profile.find().toArray();
assert.eq(1, results.length);
var result = results[0];
assert(result.hasOwnProperty('ns'));
assert(result.hasOwnProperty('millis'));
assert(result.hasOwnProperty('command'));
assert.eq('string', typeof (result.command.$truncated));
// String value is truncated.
assert(result.command.$truncated.match(/filter: { a: "a+\.\.\." }/));

assert.commandWorked(coll.getDB().runCommand({profile: 0}));
coll.getDB().system.profile.drop();
assert.commandWorked(coll.getDB().runCommand({profile: 2}));

// Test update with large string element in query portion.
assert.writeOK(coll.update({a: hugeStr}, {}));
var results = coll.getDB().system.profile.find().toArray();
assert.eq(1, results.length);
var result = results[0];
assert(result.hasOwnProperty('ns'));
assert(result.hasOwnProperty('millis'));
assert(result.hasOwnProperty('command'));
assert.eq('string', typeof (result.command.$truncated));
// String value is truncated.
assert(result.command.$truncated.match(
    /^{ q: { a: "a+\.\.\." }, u: {}, multi: false, upsert: false }$/));

assert.commandWorked(coll.getDB().runCommand({profile: 0}));
coll.getDB().system.profile.drop();
assert.commandWorked(coll.getDB().runCommand({profile: 2}));

// Test update with large string element in update portion.
assert.writeOK(coll.update({}, {a: hugeStr}));
var results = coll.getDB().system.profile.find().toArray();
assert.eq(1, results.length);
var result = results[0];
assert(result.hasOwnProperty('ns'));
assert(result.hasOwnProperty('millis'));
assert(result.hasOwnProperty('command'));
assert.eq('string', typeof (result.command.$truncated));
// String value is truncated.
assert(result.command.$truncated.match(
    /^{ q: {}, u: { a: "a+\.\.\." }, multi: false, upsert: false }$/));

assert.commandWorked(coll.getDB().runCommand({profile: 0}));
coll.getDB().system.profile.drop();
assert.commandWorked(coll.getDB().runCommand({profile: 2}));

// Test query with many elements in query portion.
var doc = {};
for (var i = 0; i < 100 * 1000; ++i) {
    doc["a" + i] = 1;
}
coll.find(doc).itcount();
var results = coll.getDB().system.profile.find().toArray();
assert.eq(1, results.length);
var result = results[0];
assert(result.hasOwnProperty('ns'));
assert(result.hasOwnProperty('millis'));
assert(result.hasOwnProperty('command'));
assert.eq('string', typeof (result.command.$truncated));
// Query object itself is truncated.
assert(result.command.$truncated.match(/filter: { a0: 1\.0, a1: .*\.\.\.$/));

assert.commandWorked(coll.getDB().runCommand({profile: 0}));
