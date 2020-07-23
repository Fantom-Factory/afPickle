
@Js internal class TestLiterals : Test {
	
	Void testLiterals() {
		fog := null as Str
		// I've had to undo some of Brian's design. 
		// It was only half implemented, so I don't think he liked it anyway!
		
		fog = writeObj(2min)
		verifyEq(fog, "2min")

		fog = writeObj(`http://fantomfactory.com`)
		verifyEq(fog, "`http://fantomfactory.com/`")
		
		fog = writeObj(TestLiterals#)
		verifyEq(fog, "afPickle::TestLiterals#")

		fog = writeObj(TestLiterals#testLiterals)
		verifyEq(fog, "afPickle::TestLiterals#testLiterals")
		
		fog = writeObj(Str[,])
		verifyEq(fog, "sys::Str[,]")
		
		fog = writeObj(Str:Int[:])
		verifyEq(fog, "[sys::Str:sys::Int][:]")
	}
	
	Str writeObj(Obj? obj) {
		Pickle.writeObj(obj)
	}
}
