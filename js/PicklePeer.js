fan.afPickle.PicklePeer = fan.sys.Obj.$extend(fan.sys.Obj);

fan.afPickle.PicklePeer.prototype.$ctor = function(self) { }

fan.afPickle.PicklePeer.prototype.$typeof = function() {
	return fan.afPickle.PicklePeer.$type;
}

fan.afPickle.PicklePeer.readObjFromIn = function(input, options) {
	if (options === undefined) options = null;
	return new afPickle_ObjDecoder(input, options).readObj();
}

fan.afPickle.PicklePeer.writeObjToOut = function(output, obj, options) {
	if (options === undefined) options = null;
	new afPickle_ObjEncoder(output, options).writeObj(obj);
}
