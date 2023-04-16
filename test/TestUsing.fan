
@Js class TestUsing : Test {
	
	Void testUsingList() {
		constClass	:= Topic2758_ConstClass{ it.name = "wotever" }
		serial		:= pickleWrite(constClass, ["using":["afPickle"]])
		
		verifyEq(serial, "using afPickle\n\nTopic2758_ConstClass {\n\tname=\"wotever\"\n}")
	}

	Void testUsingStr() {
		constClass	:= Topic2758_ConstClass{ it.name = "wotever" }
		serial		:= pickleWrite(constClass, ["using":"afPickle"])

		verifyEq(serial, "using afPickle\n\nTopic2758_ConstClass {\n\tname=\"wotever\"\n}")
	}

	Void testUsingStr2() {
		constClass	:= Topic2758_ConstClass{ it.name = "wotever" }
		serial		:= pickleWrite(constClass, ["using":""])	// check empty string don't cause errors

		verifyEq(serial, "afPickle::Topic2758_ConstClass {\n\tname=\"wotever\"\n}")
	}

	Void testUsingStr3() {
		constClass	:= Topic2758_ConstClass{ it.name = "wotever" }
		serial		:= pickleWrite(constClass, ["using":"  "])	// check empty string don't cause errors

		verifyEq(serial, "afPickle::Topic2758_ConstClass {\n\tname=\"wotever\"\n}")
	}

	private Str pickleWrite(Obj? obj, [Str:Obj?]? opts := null) {
		Pickle.writeObj(obj, opts)
	}
}
