using afPickle

@Js class TestStuff : Test {
	
	Void testStuff() {
		str := Pickle.writeObj("Str")
		echo(str.toStr)
	}
}
