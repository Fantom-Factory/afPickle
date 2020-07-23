package fan.afPickle;

import fan.sys.Map;
import fan.sys.InStream;
import fan.sys.OutStream;

public class PicklePeer {

	public static PicklePeer make(Pickle self) {
		return new PicklePeer();
	}

	public Object readObj(Pickle self, InStream in) { return readObj(self, in, null); }
	public Object readObj(Pickle self, InStream in, Map options) {
		return new ObjDecoder(in, options).readObj();
	}

	public void writeObj(Pickle self, OutStream out, Object obj) { writeObj(self, out, obj, null); }
	public void writeObj(Pickle self, OutStream out, Object obj, Map options) {
		new ObjEncoder(out, options).writeObj(obj);
	}
}
