
@Js class TestTopic2644 : Test {
	
	Void testSkipDefaults() {
		
		list := [Topic2644Obj("bongo")]
		fog  := Pickle.writeObj(list, ["skipDefaults":true])
		echo(fog)
		
		echo
		echo
		echo

		fog2 := Buf().writeObj(list, ["skipDefaults":true]).flip.readAllStr
		echo(fog2)
		
	}
}

@Serializable
@Js class Topic2644Obj {
    Str name
    new make(Str name) { this.name = name }
}
