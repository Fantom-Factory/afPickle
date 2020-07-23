

class Pickle {
	
	native Obj? readObj(InStream in, [Str:Obj]? options := null)

	native Void writeObj(OutStream out, Obj? obj, [Str:Obj]? options := null)

}

class Mewg {
	static Void main(Str[] args) {
		
		str := Buf()
		Pickle().writeObj(str.out, "Str")
		echo(str.toStr)

//		"".in.readObj(options)
//		Buf().out.writeObj(obj, options)
	}
}
