package fan.afPickle;

import fan.sys.Map;
import fan.sys.InStream;

public class PicklePeer {

	public static Object readObj(InStream in) { return readObj(in, null); }
	public static Object readObj(InStream in, Map options) {
		return new ObjDecoder(in, options).readObj();
	}

	public static String writeObj(Object obj) { return writeObj(obj, null); }
	public static String writeObj(Object obj, Map options) {
		return ObjEncoder.encode(obj, options);
	}
}
