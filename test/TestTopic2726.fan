
** https://fantom.org/forum/topic/2726
@Js class TestTopic2726 : Test {
	
	Void testNestedMaps() {
		val := [6:[6:6]]
		str := pickleWrite(val)
		verifyEq(pickleRead(str.in), val)
	}
	
	private Obj? pickleRead(InStream in, [Str:Obj?]? opts := null) {
		Pickle.readObj(in, opts)
	}

	private Str pickleWrite(Obj? obj, [Str:Obj?]? opts := null) {
		Pickle.writeObj(obj, opts)
	}
}
