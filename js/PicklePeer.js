fan.afPickle.PicklePeer = fan.sys.Obj.$extend(fan.sys.Obj);

fan.afPickle.PicklePeer.prototype.$ctor = function(self) { }

fan.afPickle.PicklePeer.prototype.$typeof = function() {
	return fan.afPickle.PicklePeer.$type;
}

fan.afPickle.PicklePeer.readObj = function(input, options) {
	if (options === undefined) options = null;
	return new afPickle_ObjDecoder(input, options).readObj();
}

fan.afPickle.PicklePeer.writeObj = function(obj, options) {
	if (options === undefined) options = null;

	var strBuf	= new fan.sys.StrBuf();
	var output	= new fan.sys.StrBufOutStream(strBuf);
	new afPickle_ObjEncoder(output, options).writeObj(obj);
	return strBuf.toStr();
}
