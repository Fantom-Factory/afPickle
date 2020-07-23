using concurrent::AtomicInt

** https://fantom.org/forum/topic/2644
@Js class TestTopic2644 : Test {
	
	Void testSkipDefaults() {
		list := [Topic2644_Obj1("bongo")]
		fog  := pickleWrite(list, ["skipDefaults":true])
		
		echo(fog.replace("\t", "#"))
		echo("afPickle::Topic2644_Obj1[\n\tafPickle::Topic2644_Obj1 {\n\t\tname=\"bongo\"\n\t}\n]".replace("\t", "#"))
		
		verifyEq("afPickle::Topic2644_Obj1[\n\tafPickle::Topic2644_Obj1 {\n\t\tname=\"bongo\"\n\t}\n]", fog)
	}
	
	Void testDefObjCreation() {
		// create a list of 100 objects
		list := Topic2644_Obj2[,]
		100.times { list.add(Topic2644_Obj2()) }
		
		// serialise list
		Topic2644_Obj2.instanceCount.val = 0
		pickleWrite(list, ["skipDefaults":true])
		
		// assert that only 1 defVal instance is created when serialising object 
		verifyEq(Topic2644_Obj2.instanceCount.val, 1)
	}

	private Obj? pickleRead(InStream in, [Str:Obj?]? opts := null) {
		Pickle.readObj(in, opts)
	}

	private Str pickleWrite(Obj? obj, [Str:Obj?]? opts := null) {
		Pickle.writeObj(obj, opts)
	}
}

@Serializable
@Js class Topic2644_Obj1 {
	Str name
	new make(Str name) { this.name = name }
}

@Serializable
@Js class Topic2644_Obj2 {
	static const AtomicInt instanceCount := AtomicInt()
	
	new make() {
		instanceCount.increment
	}
}