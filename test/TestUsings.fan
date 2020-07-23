
@Js class TestUsings : Test {
	
	Void testUsings() {
		constClass	:= Topic2758_ConstClass{ it.name = "wotever" }
		serial		:= pickleWrite(constClass, ["usings":["afPickle"]])
		
		verifyEq(serial, "using afPickle\n\nTopic2758_ConstClass {\n\tname=\"wotever\"\n}")
	}

	private Str pickleWrite(Obj? obj, [Str:Obj?]? opts := null) {
		Pickle.writeObj(obj, opts)
	}
}
