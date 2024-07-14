
class PicklePeer extends sys.Obj {

	constructor(self) { super(); }

	static readObjFromIn(input, options) {
		if (options === undefined) options = null;
		return new fanx_ObjDecoder(input, options).readObj();
	}

	static writeObjToOut(output, obj, options) {
		if (options === undefined) options = null;
		new fanx_ObjEncoder(output, options).writeObj(obj);
	}
}

