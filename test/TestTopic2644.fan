using concurrent::AtomicInt

** Tests for https://fantom.org/forum/topic/2644
@Js class TestTopic2644 : Test {
	
	Void testSkipDefaults() {
		list := [Topic2644Obj1("bongo")]
		fog  := writeObj(list, ["skipDefaults":true])
		verifyEq("afPickle::Topic2644Obj1\n[\nafPickle::Topic2644Obj1\n{\nname=\"bongo\"\n}\n]", fog)
	}
	
    Void testDefObjCreation() {
        // create a list of 100 objects
        list := Topic2644Obj2[,]
        100.times { list.add(Topic2644Obj2()) }

        // serialise list
        Topic2644Obj2.instanceCount.val = 0
        writeObj(list, ["skipDefaults":true])

        // assert that only 1 defVal instance is created when serialising object 
        verifyEq(Topic2644Obj2.instanceCount.val, 1)
    }

	Str writeObj(Obj? obj, Obj? opts := null) {
		try return Pickle.writeObj(obj, opts)
		catch (Err e) { e.trace; throw e }
	}
}

@Serializable
@Js class Topic2644Obj1 {
    Str name
    new make(Str name) { this.name = name }
}

@Serializable
@Js class Topic2644Obj2 {
    static const AtomicInt instanceCount := AtomicInt()
    
    new make() {
        instanceCount.increment
    }
}