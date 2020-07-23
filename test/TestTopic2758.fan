
** https://fantom.org/forum/topic/2758
@Js class TestTopic2758 : Test {
	
	Void testNonConstItBlocks() {
		constClass    := Topic2758_ConstClass    { it.name = "wotever" }
		notConstClass := Topic2758_NotConstClass { it.name = "wotever" }
		
		serial1 := pickleWrite(constClass)
		pickleRead(serial1.in)	// --> okay

		serial2 := pickleWrite(notConstClass)
		pickleRead(serial2.in)	// --> ERROR!	
	}

	private Obj? pickleRead(InStream in, [Str:Obj?]? opts := null) {
		Pickle.readObj(in, opts)
	}

	private Str pickleWrite(Obj? obj, [Str:Obj?]? opts := null) {
		Pickle.writeObj(obj, opts)
	}
}

@Serializable
@Js const class Topic2758_ConstClass {
    const Str name
    new make(|This| f) { f(this) }
}

@Serializable
@Js class Topic2758_NotConstClass {
    Str name
    new make(|This| f) { f(this) }
}
