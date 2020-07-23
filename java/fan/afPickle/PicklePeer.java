package fan.afPickle;

import fan.sys.Map;
import fan.sys.InStream;
import fan.sys.OutStream;
import fan.sys.StrBuf;
import fan.sys.StrBufOutStream;

public class PicklePeer {

	public static Object readObj(InStream in) { return readObj(in, null); }
	public static Object readObj(InStream in, Map options) {
		return new ObjDecoder(in, options).readObj();
	}

	public static String writeObj(Object obj) { return writeObj(obj, null); }
	public static String writeObj(Object obj, Map options) {
		StrBuf strBuf	= StrBuf.make(256);
		OutStream out	= new StrBufOutStream(strBuf);
		new ObjEncoder(out, options).writeObj(obj);
		return strBuf.toStr();
	}
}
