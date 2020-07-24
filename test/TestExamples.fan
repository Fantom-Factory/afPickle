
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
}

@Js class T_Gerkin1 {
    Str name
    Str colour
    
    new make(Str colour, |This| f) {
        f(this)
        this.colour = colour
    }
}