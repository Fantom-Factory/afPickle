
@Js class TestExamples : Test {
	
	Void testMakeArgs() {
		str := "afPickle::T_Gerkin1 {\nname=\"Rick\"\n}"
		ger := (T_Gerkin1) Pickle.readObj(str, ["makeArgs" : Str["Green"]])
		verifyEq(ger.name,		"Rick")
		verifyEq(ger.colour,	"Green")
	}
	
	Void testMakeObjFn() {
		fnCalled := false
		str := "afPickle::T_Gerkin1 {\nname=\"Rick\"\n}"
		ger := (T_Gerkin1) Pickle.readObj(str, [
			"makeObjFn" : |Type type, Field:Obj? fieldVals->Obj?| {
				fnCalled = true
				return type.make(["Brown", Field.makeSetFunc(fieldVals)])
			}]
		)
		verifyEq(ger.name,		"Rick")
		verifyEq(ger.colour,	"Brown")
		verifyEq(fnCalled, 		true)
	}
	
	Void testSkipNulls() {
		str := Pickle.writeObj(T_Gerkin1("Orange"){}, ["skipNulls":true])
		
		verifyEq(str.contains("colour"),	true)
		verifyEq(str.contains("name"),		false)
	}
}

@Serializable
@Js class T_Gerkin1 {
    Str? name
    Str? colour
    
    new make(Str colour, |This| f) {
        f(this)
        this.colour = colour
    }
}