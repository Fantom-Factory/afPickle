
@Js internal class TestLiterals : Test {
	
	Void testLiterals() {
		fog := null as Str
		// I've had to undo some of Brian's design. 
		// It was only half implemented, so I don't think he liked it anyway!
		
		fog = writeObj(2min)
		verifyEq(fog, "using sys\n\n2min")

		fog = writeObj(`http://fantomfactory.com`)
		verifyEq(fog, "using sys\n\n`http://fantomfactory.com/`")
		
		fog = writeObj(TestLiterals#)
		verifyEq(fog, "using sys\n\nafPickle::TestLiterals#")

		// requires this sys patch from "JS: Type methods (undefined)"
		// https://fantom.org/forum/topic/2770
		fog = writeObj(TestLiterals#testLiterals)
		verifyEq(fog, "using sys\n\nafPickle::TestLiterals#testLiterals")
		
		fog = writeObj(Str[,])
		verifyEq(fog, "using sys\n\nStr[,]")
		
		fog = writeObj(Str:Int[:])
		verifyEq(fog, "using sys\n\n[Str:Int][:]")
	}
	
	Str writeObj(Obj? obj) {
		Pickle.writeObj(obj)
	}
}
