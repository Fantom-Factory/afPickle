package fan.afPickle;

import fan.sys.Map;
import fan.sys.OutStream;
import fan.sys.InStream;

public class PicklePeer {

	public static Object readObjFromIn(InStream in) { return readObjFromIn(in, null); }
	public static Object readObjFromIn(InStream in, Map options) {
		return new ObjDecoder(in, options).readObj();
	}

	public static void writeObjToOut(OutStream out, Object obj) { writeObjToOut(out, obj, null); }
	public static void writeObjToOut(OutStream out, Object obj, Map options) {
		new ObjEncoder(out, options).writeObj(obj);
	}
}
