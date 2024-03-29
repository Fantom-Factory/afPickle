
**
** SerializationTest - copied from testSys::SerializationTest
**
@Js
class SerializationTest : Test {

//////////////////////////////////////////////////////////////////////////
// Literals
//////////////////////////////////////////////////////////////////////////

	Void testLiterals() {
		// null literal
		verifySer("null", null)

		// Bool literals
		verifySer("true", true)
		verifySer("false", false)

		// Int literals
		verifySer("5", 5)
		verifySer("5_000", 5000)
		verifySer("0xabcd_0123_4567", 0xabcd_0123_4567)
		if (!js) {
			verifySer("9223372036854775807", 9223372036854775807)
			verifySer("-9223372036854775808", -9223372036854775807-1)
		}
		verifySer("-987", -987)
		verifySer("'A'", 'A')
		verifySer("'\u0c45'", 0xc45)
		verifyErr(IOErr#) { verifySer("0x", 0) }
		if (!js) {
			verifyErr(IOErr#) { verifySer("9223372036854775808", 0) }
			verifyErr(IOErr#) { verifySer("-9223372036854775809", 0) }
		}

		// Float literals
		verifySer("3f", 3f)
		verifySer("-99f", -99f)
		verifySer("2.0F", 2.0f)
		verifySer("8.4f", 8.4f)
		verifySer("-0.123f", -0.123f)
		verifySer(".2f", .2f)
		verifySer("-.4f", -.4f)
		verifySer("2e10f", 2e10f)
		verifySer("-8e-9f", -8e-9f)
		verifySer("-8.4E-6F", -8.4E-6f)
		if (!js) {
			// todo FIXIT
			verifySer("sys::Float(\"NaN\")", Float.nan)
		}
		verifySer("sys::Float(\"INF\")", Float.posInf)
		verifySer("sys::Float(\"-INF\")", Float.negInf)
		verifyErr(IOErr#) { verifySer("3e", null) }
		verifyErr(IOErr#) { verifySer("3eX", null) }

		// Decimal literals
		verifySer("7d", 7d)
		verifySer("-2d", -2d)
		verifySer("2.00", 2.00d)
		verifySer("2.00d", 2.00d)
		verifySer("2.00D", 2.00D)
		verifySer("-2.00", -2.00d)
		verifySer("-0.07", -0.07D)
		verifySer("123_4567_890.123_456", 123_4567_890.123_456d)
		verifySer("-123_4567_890.123_456", -123_4567_890.123_456d)
		verifySer("7.9e28", 7.9e28d)
		if (!js) {
			verifySer("9223372036854775800d", 9223372036854775800d)
			verifySer("9223372036854775809d", 9223372036854775809d)
			verifySer("92233720368547758091234d", 92233720368547758091234d)
			verifySer("-92233720368547758091234.678d", -92233720368547758091234.678d)
		}

		// String literals
		verifySer("\"\"", "")
		verifySer("\"hi!\"", "hi!")
		verifySer("\"hi!\nthere\"", "hi!\nthere")
		verifySer("\"hi!\\nthere\"", "hi!\nthere")
		verifySer("\"a\u0dffb\t\"", "a\u0dffb\t")
		verifySer("\"one\\ntwo\\\$three\\\\four\\\"five\"", "one\ntwo\$three\\four\"five")

		// Duration literals
		verifySer("90ns", 90ns)
		verifySer("-8ms", -8ms)
		verifySer("1.23sec", 1.23sec)
		verifySer("0.5min", 0.5min)
		verifySer("24hr", 1day)
		verifySer("0.5day", 12hr)

		// Uri literals
		verifySer("`http://foo/path/file.txt#frag`", `http://foo/path/file.txt#frag`)
		verifySer("`../there`", `../there`)
		verifySer("`?a=b&c`", `?a=b&c`)
		verifySer("`a b`", `a b`)
		verifySer("`a\\tb`", `a\tb`)
		verifySer("`\\``", `\``)
		verifySer("`\\u025E\\n\\\$ \\`!\"`", `\u025E\n\$ \`!"`)

		// Type literals
		verifySer("sys::Num#", Num#)
		verifySer("afPickle::SerializationTest#", Type.of(this))
		verifySer("using afPickle\n SerializationTest#", Type.of(this))
		verifyErr(IOErr#) { pickleRead("crazyFooBad::Bar#".in) }
		verifyErr(IOErr#) { pickleRead("sys::Foo#".in) }
		verifySer("using sys\nStr[]#", Str[]#)
		verifySer("sys::Str[]#", Str[]#)
		verifySer("sys::Str[]?#", Str[]?#)
		verifySer("sys::Str?[][]#", Str?[][]#)
		verifySer("sys::Str:sys::Int#", [Str:Int]#)
		verifySer("[sys::Str:sys::Int?]#", [Str:Int?]#)
		verifySer("using sys\nStr:Int?#", [Str:Int?]#)
		verifySer("using sys\n[Str:Int?][]#", [Str:Int?][]#)
		verifySer("using sys\n[Str:Int?][]?#", [Str:Int?][]?#)

		// Slot literals
		verifySer("sys::Str#replace", Str#replace)
		verifySer("sys::Float#pi", Float#pi)
		verifySer("afPickle::SerializationTest#testLiterals", #testLiterals)
	}

//////////////////////////////////////////////////////////////////////////
// Simples
//////////////////////////////////////////////////////////////////////////

	Void testSimples() {
		now := DateTime.now

		verifySer("sys::Version(\"1.2.3\")", Version.make([1,2,3]))
		verifySer("sys::Depend(\"foo 1.2-3.4\")", Depend.fromStr("foo 1.2-3.4"))
		verifySer("sys::Locale(\"fr-CA\")", Locale.fromStr("fr-CA"))
		verifySer("sys::TimeZone(\"London\")", TimeZone.fromStr("London"))
		verifySer("sys::DateTime(\"$now\")", now)
		verifySer("sys::Charset(\"utf-8\")", Charset.utf8)
		verifySer("afPickle::SerSimple(\"7,8\")", SerSimple.make(7,8))
		verifySer("sys::Regex(\"foo\")", Regex<|foo|>)

		verifySer("afPickle::EnumAbc(\"C\")", EnumAbc.C)
		verifySer("afPickle::Suits(\"spades\")", Suits.spades)

		verifyErr(IOErr#) { verifySer("sys::Version(x)", null) }
		verifyErr(IOErr#)	{ verifySer("sys::Version(\"x\"", null) }
		verifyErr(ParseErr#) { verifySer("sys::Version(\"x\")", null) }
	}

//////////////////////////////////////////////////////////////////////////
// Lists
//////////////////////////////////////////////////////////////////////////

	Void testLists() {
		verifySer("[,]", Obj?[,])
		verifySer("sys::Obj?[,]", Obj?[,])
		verifySer("sys::Obj[,]", Obj[,])
		verifySer("[null]", Obj?[null])
		verifySer("[null, null]", Obj?[null, null])
		verifySer("sys::Uri[,]", Uri[,])
		verifySer("sys::Int?[,]", Int?[,])
		verifySer("sys::Int?[null, 2]", Int?[null, 2])
		verifySer("[null, 3]", Int?[null, 3])
		verifySer("[3, null]", Int?[3, null])
		verifySer("[3, 2f]", Num[3, 2f])
		verifySer("[3, null, 2f]", Num?[3, null, 2f])
		verifySer("[1, 2, 3]", Int[1,2,3])
		verifySer("[1, null, 3]", Int?[1,null,3])
		verifySer("[1, 2f, 3]", [1,2f,3])
		verifySer("[1, 2f, 3.00,]", Num[1,2f,3.00d])
		verifySer("[1, [7ns], \"3\"]", [1, [7ns], "3"])
		verifySer("sys::Num[1, 2, 3]", Num[1, 2, 3])
		verifySer("sys::Int[][sys::Int[1],sys::Int[2]]", sys::Int[][sys::Int[1],sys::Int[2]])
		verifySer("[[1],[2]]", [[1],[2]])
		verifySer("sys::Int[][,]", Int[][,])
		verifySer("sys::Str[][][,]", Str[][][,])
		verifySer("[[[\"x\"]]]", [[["x"]]])
		verifySer("sys::Str[][][[[\"x\"]]]", [[["x"]]])

		// errors
		verifyErr(IOErr#) { verifySer("[", null) }
		verifyErr(IOErr#) { verifySer("[,", null) }
		verifyErr(IOErr#) { verifySer("[]", null) }
		verifyErr(IOErr#) { verifySer("[3,", null) }
	}

//////////////////////////////////////////////////////////////////////////
// Maps
//////////////////////////////////////////////////////////////////////////

	Void testMaps() {
		verifySer("[:]", Obj:Obj?[:])
		verifySer("using sys\nObj:Obj[:]", Obj:Obj[:])
		verifySer("using sys\nObj:Obj?[:]", Obj:Obj?[:])
		verifySer("sys::Str:sys::Str[:]", Str:Str[:])
		verifySer("sys::Int:sys::Uri?[:]", Int:Uri?[:])
		verifySer("[sys::Int:sys::Uri][:]", Int:Uri[:])
		verifySer("[sys::Int:sys::Uri?][:]", Int:Uri?[:])
		verifySer("[1:1ns, 2:2ns]", [1:1ns, 2:2ns])
		verifySer("[\"1\":1, \"2\":2f]", ["1":1, "2":2f])
		verifySer("[\"1\":1, \"2\":2f,]", Str:Num["1":1, "2":2f])
		verifySer("sys::Str:sys::Num[\"1\":1, \"2\":2f]", Str:Num["1":1, "2":2f])
		verifySer("[sys::Str:sys::Num][\"1\":1, \"2\":2f]", Str:Num["1":1, "2":2f])
		verifySer("[0:sys::Str[,], 1:[\"x\"]]", [0:Str[,], 1:["x"]])
		verifySer("sys::Int:sys::Duration?[1:null]", Int:Duration?[1:null])
		verifySer("[1:null, 2:8ns]", Int:Duration?[1:null, 2:8ns])
		verifySer("[1:8ms, 2:null]", Int:Duration?[1:8ms, 2:null])
		verifySer("[1:null, 2:8ns, 3:3]", Int:Obj?[1:null, 2:8ns, 3:3])

		// test ordering
		Str:Int m := verifySer("""["b":1, "a":2, "c":5, "e":3, "f":3]""",	["b":1, "a":2, "c":5, "e":3, "f":3])
		verifyEq(m.keys, ["b", "a", "c", "e", "f"])

		// various nested type/list type signatures
		verifySer("sys::Int:sys::Uri[,]", Int:Uri[,])
		verifySer("[sys::Int:sys::Uri][,]", [Int:Uri][,])
		verifySer("[sys::Int:sys::Uri][][,]", [Int:Uri][][,])
		verifySer("[sys::Int:sys::Uri][][][,]", [Int:Uri][][][,])
		verifySer("sys::Str:sys::Bool[][:]", Str:Bool[][:])
		verifySer("[sys::Str:sys::Bool[]][:]", [Str:Bool[]][:])
		verifySer("[sys::Str:sys::Bool[]][][,]", [Str:Bool[]][][,])
		verifySer("[sys::Int:sys::Bool[]][[2:[true]]]", [Int:Bool[]][[2:[true]]])
		verifySer("[sys::Int:sys::Bool[]][[sys::Int:sys::Bool[]][2:[true]]]", [Int:Bool[]][[2:[true]]])
		verifySer("[sys::Int:sys::Bool[]][sys::Int:sys::Bool[][2:[true]]]", [Int:Bool[]][[2:[true]]])
		verifySer("[sys::Int:sys::Int][sys::Int:sys::Int[2:20]]", [Int:Int][Int:Int[2:20]])
		verifySer("[sys::Int:sys::Int][[sys::Int:sys::Int][2:20]]", [Int:Int][Int:Int[2:20]])
		// TODO: need to fix nullable map inference...
		verifySer("sys::Version:sys::Int[sys::Version(\"1.2\"):1]", Version:Int[Version.fromStr("1.2"):1])
		verifySer("[sys::Version:sys::Int][sys::Version(\"1.2\"):1]", Version:Int[Version.fromStr("1.2"):1])
		verifySer("sys::Version:sys::Int[[sys::Version(\"1.2\"):1]]", [sys::Version:sys::Int][Version:Int[Version.fromStr("1.2"):1]])

		// errors
		verifyErr(IOErr#) { verifySer("[:", null) }
		verifyErr(IOErr#) { verifySer("[:3", null) }
		verifyErr(IOErr#) { verifySer("[3:", null) }
		verifyErr(IOErr#) { verifySer("[3:2", null) }
		verifyErr(IOErr#) { verifySer("[3:2,", null) }
		verifyErr(IOErr#) { verifySer("[3:2,4", null) }
		verifyErr(IOErr#) { verifySer("[3:2,4:", null) }
		verifyErr(IOErr#) { verifySer("[3:2,4]", null) }
	}

//////////////////////////////////////////////////////////////////////////
// Complex
//////////////////////////////////////////////////////////////////////////

	Void testComplex() {
		x := SerA.make
		verifySer("afPickle::SerA", x)
		verifySer("afPickle::SerA {}", x)

		x.i = 0xab77
		verifySer("afPickle::SerA { i = 0xab77 }", x)
		verifySer("afPickle::SerA { i = 0xab77; }", x)
		verifySer("afPickle::SerA {\ni\n=\n0xab77\n}", x)

		x.b = false
		x.i = 69
		x.f = -3f
		x.d = 6min
		x.u = `foo.txt`
		verifySer(
		"afPickle::SerA {
		 	 b=false; i=69
		 	 f=-3f
		 	 d = 6min;
		 	 u=`foo.txt`}", x)

		verifyErr(IOErr#) { verifySer("afPickle::SerA {", null) }
		verifyErr(IOErr#) { verifySer("afPickle::SerA {b", null) }
		verifyErr(IOErr#) { verifySer("afPickle::SerA {b}", null) }
		verifyErr(IOErr#) { verifySer("afPickle::SerA {b=", null) }
		verifyErr(IOErr#) { verifySer("afPickle::SerA {b=}", null) }
		verifyErr(IOErr#) { verifySer("afPickle::SerA {b=true", null) }
		verifyErr(IOErr#) { verifySer("afPickle::SerA {b=3}", null) }
		verifyErr(IOErr#) { verifySer("afPickle::SerA {b=true i=5}", null) }
		verifyErr(IOErr#) { verifySer("afPickle::SerA {xxx=3}", null) }

		verifyErr(IOErr#) { pickleWrite(this) }
	}

	Void testComplexInferred() {
		x := SerA.make
		x.sList = Str[,]
		verifySer("afPickle::SerA { sList = [,] }", x)
		verifySer("afPickle::SerA { sList = sys::Str[,] }", x)

		x.nList = Num[,]
		verifySer(
		"afPickle::SerA
		 {
		   sList = [,]
		 		nList = [,]
		 	}", x)

		x.nList = Num[4, 5, 6]
		verifySer(
		"afPickle::SerA {
		 		sList = [,];
		 		nList = [4, 5, 6]
		 	}", x)

		x.isMap = Int:Str[:]
		verifySer(
		"afPickle::SerA {
		 		sList = [,];
		 		nList = [4, 5, 6]
		 		isMap = [:]
		 	}", x)

		x.isMap = Int:Str[2:"two"]
		verifySer(
		"afPickle::SerA {
		 		sList = [,];
		 		nList = [4, 5, 6]
		 		isMap = [2:\"two\"]
		 	}", x)

		x.isMap = Int:Str[2:"two"]
		verifySer(
		"afPickle::SerA {
		 		sList = [,];
		 		nList = sys::Num[4, 5, 6]
		 		isMap = sys::Int:sys::Str[2:\"two\"]
		 	}", x)
	}

	Void testListMap() {
		x := SerListMap.make
		x.map["bar"] = 5
		x.map["foo"] = Str:Obj[:]
		SerListMap y := verifySer("afPickle::SerListMap { map=[\"foo\":[sys::Str:sys::Obj][:], \"bar\":5] }", x)
		verifyType(y.map["foo"], Str:Obj#)
	}

	Void testComplexCompound() {
		x := SerA.make
		x.kids = SerA[,]
		verifySer("afPickle::SerA { kids	= [,] }", x)
		verifySer("afPickle::SerA { kids	= afPickle::SerA[,] }", x)

		x = SerA.make
		x.kids = [SerA.make]
		verifySer("afPickle::SerA { kids	= [afPickle::SerA {}] }", x)
		verifySer("afPickle::SerA { kids	= [afPickle::SerA] }", x)
		verifySer("afPickle::SerA { kids	= afPickle::SerA[afPickle::SerA] }", x)
		verifySer("afPickle::SerA { kids	= afPickle::SerA[afPickle::SerA {}] }", x)

		x = SerA.make
		x.kids = SerA[SerB.make]
		verifySer("afPickle::SerA { kids = [afPickle::SerB {}] }", x)
		verifySer("afPickle::SerA { kids = [afPickle::SerB] }", x)
		verifySer("afPickle::SerA { kids = afPickle::SerA[afPickle::SerB] }", x)
		verifySer("afPickle::SerA { kids = afPickle::SerA[afPickle::SerB {}] }", x)

		x = SerA.make
		x.kids = [SerA.make, SerA.make]
		verifySer("afPickle::SerA { kids	= afPickle::SerA[afPickle::SerA {}, afPickle::SerA {}] }", x)
		verifySer("afPickle::SerA { kids	= afPickle::SerA[afPickle::SerA, afPickle::SerA] }", x)
		verifySer("afPickle::SerA { kids	= [afPickle::SerA, afPickle::SerA] }", x)
		verifySer("afPickle::SerA { kids	= [afPickle::SerA {}, afPickle::SerA] }", x)

		x = SerA.make
		x.i = 1972
		x.kids = [SerB.make, SerA.make]
		x.kids[0].i	= 0xabcd
		x.kids[0]->z = '!'
		x.kids[1].i	= 2007
		verifySer("afPickle::SerA { i=1972; kids=[afPickle::SerB {i=0xabcd;z='!'}, afPickle::SerA{i=2007}] }", x)
		verifySer("afPickle::SerA { kids=[afPickle::SerB {i=0xabcd;z='!'}, afPickle::SerA{i=2007}]; i=1972 }", x)
		verifySer("afPickle::SerA { kids=afPickle::SerA[afPickle::SerB {i=0xabcd;z='!'}, afPickle::SerA{i=2007}]; i=1972 }", x)
	}

	Void testComplexOptions() {
		SerA x := pickleRead("afPickle::SerA {}".in)
		verifyEq(x.s, null)
		verifyEq(x.d, null)

		x = pickleRead("afPickle::SerA {}".in, ["makeArgs":["foo"]])
		verifyEq(x.s, "foo")
		verifyEq(x.d, null)

		x = pickleRead("afPickle::SerA { s = \"!\" }".in, ["makeArgs":["foo", 5min]])
		verifyEq(x.s, "!")
		verifyEq(x.d, 5min)

		SerParamsAndItBlock y := pickleRead("""afPickle::SerParamsAndItBlock {c="C"; d=123}""".in, ["makeArgs":["A", 2018]])
		verifyEq(y.a, "A")
		verifyEq(y.b, 2018)
		verifyEq(y.c, "C")
		verifyEq(y.d, 123)

		y = pickleRead("""afPickle::SerParamsAndItBlock {a="AO"; b=7; c="C"; d=123}""".in, ["makeArgs":["A", 2018]])
		verifyEq(y.a, "AO")
		verifyEq(y.b, 7)
		verifyEq(y.c, "C")
		verifyEq(y.d, 123)
	}

	Void testComplexConst() {
		verifyComplexConst("afPickle::SerConst", SerConst.make)
		verifyComplexConst("afPickle::SerConst { a=7 }", SerConst.make(7))
		verifyComplexConst("afPickle::SerConst { a=7; b=[2,3] }", SerConst.make(7, [2,3]))
		verifyComplexConst("afPickle::SerConst { b=[7] }", SerConst.make(0, [7]))
		verifyComplexConst("afPickle::SerConst { b=null; c=null }", SerConst.make)
		verifyComplexConst("afPickle::SerConst { c=[[4],[5,6]] }", SerConst.make(0, null, [[4],[5,6]]))
		verifyComplexConst("afPickle::SerConst { c=[sys::Int[,]] }", SerConst.make(0, null, [Int[,]]))
		verifyErr(IOErr#) { verifyComplexConst("afPickle::SerConst { c=5 }", SerConst.make) }

		// todo
		//verifyErr(IOErr#) { verifyComplexConst("afPickle::SerConst { c=[5] }", SerConst.make) }
	}

	Void verifyComplexConst(Str s, SerConst x) {
		SerConst y := verifySer(s, x)
		verifyEq(x, y)
		if (y.b != null) verify(y.b.isImmutable)
	}

	Void testTransient() {
		x := SerA { skip = "foo" }
		doc := pickleWrite(x)
		SerA y := pickleRead(Buf.make.print(doc).flip.in)
		verifyEq(x.skip, "foo")
		verifyEq(y.skip, "skip")
	}

//////////////////////////////////////////////////////////////////////////
// It Blocks
//////////////////////////////////////////////////////////////////////////

	Void testItBlocks() {
		verifySer("""afPickle::SerItBlock {a="A"}""", SerItBlock { a = "A"; b = "unset" })
		verifySer("""afPickle::SerItBlock {a="A"; b="B"}""", SerItBlock { a = "A"; b = "B" })
		verifySer("""afPickle::SerItBlock {a="A"; c="C"}""", SerItBlock { a = "A"; b = "unset"; c="C" })
		verifySer("""afPickle::SerItBlock {a="A"; c="C", b="X"}""", SerItBlock { a = "A"; b = "X"; c="C" })
		obj := verifySer("""afPickle::SerItBlock {a="A"; d=[1, 2, 3]}""", SerItBlock { a = "A"; b = "unset"; d = [1, 2, 3] })
		verifyEq(obj->d.isImmutable, true)

		verifySer("""[afPickle::SerItBlock { a="A!"; b="B!" }]""", [SerItBlock{it.a="A!";it.b="B!"}])
		verifySer("""[afPickle::SerItBlock { a="A!"; b="B!" }]""", [SerItBlock{it.a="A!";it.b="B!"}], ["skipDefaults":true])

		if (!js)	// JS creates the class, but doesn't complain about field "a" not being set in the ctor
		verifyErr(IOErr#) { verifySer("""afPickle::SerItBlock {}""", null) }
	}

//////////////////////////////////////////////////////////////////////////
// Collections
//////////////////////////////////////////////////////////////////////////

	Void testIntCollection() {
		x := SerIntCollection.make
		verifySer("afPickle::SerIntCollection {}", x)

		x.list.add(3)
		verifySer("afPickle::SerIntCollection {3}", x)

		x.list.add(4)
		verifySer("afPickle::SerIntCollection {3; 4}", x)

		x.list.add(5)
		verifySer("afPickle::SerIntCollection {3; 4\n5}", x)

		x.list.add(6)
		verifySer("afPickle::SerIntCollection {3, 4, 5, 6}", x)

		x.name = "hi"
		verifySer("afPickle::SerIntCollection {name=\"hi\"; 3; 4\n5,6}", x)
		verifySer("afPickle::SerIntCollection {3; 4\n5,6,name=\"hi\"}", x)
	}

	Void testFolderCollection() {
		x := SerFolder.make
		verifySer("afPickle::SerFolder{}", x)

		a := SerFolder.make
		x.list.add(a)
		verifySer("afPickle::SerFolder { afPickle::SerFolder{} }", x)

		x.name = "root"
		a.name = "a"
		a.add(SerFolder.make { name = "a.1" })
		a.add(SerFolder.make { name = "a.2" })
		verifySer(
		"afPickle::SerFolder { name=\"root\"
		 		afPickle::SerFolder {
		 			afPickle::SerFolder{name=\"a.1\"}
		 			name=\"a\"
		 			afPickle::SerFolder{name=\"a.2\"}
		 		}
		 	}", x)
	}

	Void testListMapFolder() {
		verifySer(
		"[
		 		afPickle::SerFolder {name=\"a\"},
		 		afPickle::SerFolder {name=\"b\"},
		 		afPickle::SerFolder {
		 			name=\"c\",
		 			afPickle::SerFolder { name=\"c.1\" },
		 		}
		 	]",
			[
				SerFolder{name="a"},
				SerFolder {name="b"},
				SerFolder {name="c"; SerFolder{name="c.1"},},
			])

		verifySer(
		"[
		 		33: afPickle::SerFolder {name=\"a\"},
		 		44: afPickle::SerFolder { name=\"b\", afPickle::SerFolder { name=\"sub-b\" } }
		 	]",
			[
				33: SerFolder{name="a"},
				44: SerFolder {name="b"; SerFolder{name="sub-b"},},
			])
	}

//////////////////////////////////////////////////////////////////////////
// Collection Inference
//////////////////////////////////////////////////////////////////////////

	Void testCollectionInference() {
		verifyCollectionInference(SerCollectionInference { a = [,] })
		verifyCollectionInference(SerCollectionInference { a = ["foo"] })

		verifyCollectionInference(SerCollectionInference { b = [,] })
		verifyCollectionInference(SerCollectionInference { b = [4] })

		verifyCollectionInference(SerCollectionInference { x = [:] })
		verifyCollectionInference(SerCollectionInference { x = ["x":5f] })

		verifyCollectionInference(SerCollectionInference { y = [`s`:null, `t`:""] })

		verifyCollectionInference(SerCollectionInference { w = "foo" }, Str#)
		verifyCollectionInference(SerCollectionInference { w = ["foo"] }, Str[]#)
		verifyCollectionInference(SerCollectionInference { w = ["", null] }, Str?[]#)
		verifyCollectionInference(SerCollectionInference { w = ["a":3, "b":4f] }, Str:Num#)
	}

	SerCollectionInference verifyCollectionInference(SerCollectionInference s, Type? w := null) {
		sb := pickleWrite(s)
		s = pickleRead(sb.toStr.in)
		if (s.a != null) verifyEq(s.a.typeof, Str[]#)
		if (s.b != null) verifyEq(s.b.typeof, Num?[]#)
		if (s.x != null) verifyEq(s.x.typeof, [Str:Num]#)
		if (s.y != null) verifyEq(s.y.typeof, [Uri:Str?]#)
		if (s.w != null) verifyEq(s.w.typeof, w)
		return s
	}

//////////////////////////////////////////////////////////////////////////
// Using
//////////////////////////////////////////////////////////////////////////

	Void testUsing() {
		verifySer(
			"using afPickle
			 SerFolder { name=\"foo\" }",
			SerFolder { name="foo" })

		verifySer(
			"using afPickle::SerFolder
			 SerFolder { name=\"foo\" }",
			SerFolder { name="foo" })

		verifySer(
			"using afPickle::SerFolder as FooBar
			 FooBar { name=\"foo\" }",
			SerFolder { name="foo" })

		verifySer(
			"using sys
			 using afPickle
			 using sys::DateTime as DT
			 Obj
			 [
			 	 Str[,],
			 	 Int:SerFolder[:],
			 	 DT#
			 ]",
			[Str[,], Int:SerFolder[:], DateTime#])

		verifyErr(IOErr#) { verifySer("using sys using afPickle; SerFolder {}", null) }
		verifyErr(IOErr#) { verifySer("using sys::Int using afPickle; SerFolder {}", null) }
		verifyErr(IOErr#) { verifySer("using sys::Int as Integer afPickle::SerFolder {}", null) }
		verifyErr(IOErr#) { verifySer("SerFolder {}", null) }
	}

//////////////////////////////////////////////////////////////////////////
// Comments
//////////////////////////////////////////////////////////////////////////

	Void testComments() {
		verifySer("// header\n8", 8)
		verifySer("// header\r\n8", 8)
		verifySer("// header\r8", 8)
		verifySer("8 // header", 8)
		verifySer("** header\n8", 8)
		verifySer("** header\r\n8", 8)
		verifySer("** header\r8", 8)
		verifySer("/* header*/8", 8)
	}

//////////////////////////////////////////////////////////////////////////
// Synthetics
//////////////////////////////////////////////////////////////////////////

	Void testSynthetics() {
		SerSynthetic? x := null

		x = verifySer("afPickle::SerSynthetic {}", SerSynthetic.make)
		verifyEq(x.b, 4)

		x = verifySer("afPickle::SerSynthetic { a = 6}", SerSynthetic.make(6))
		verifyEq(x.b, 7)
	}

//////////////////////////////////////////////////////////////////////////
// Pretty Printing
//////////////////////////////////////////////////////////////////////////

	Void testPrettyPrinting() {
		x := SerA.make
		verifyPrettyPrinting(x, "afPickle::SerA")

		x.i = 12345
		verifyPrettyPrinting(x,
		"afPickle::SerA {
		   i=12345
		 }")

		x.f = Float.posInf
		verifyPrettyPrinting(x,
		"afPickle::SerA {
		   i=12345
		   f=sys::Float(\"INF\")
		 }")

		x.nList = Num[,]
		verifyPrettyPrinting(x,
		"afPickle::SerA {
		   i=12345
		   f=sys::Float(\"INF\")
		   nList=[,]
		 }")

		x.nList = Num[2,3]
		verifyPrettyPrinting(x,
		"afPickle::SerA {
		   i=12345
		   f=sys::Float(\"INF\")
		   nList=[2,3]
		 }")

		x.kids = SerA[,]
		verifyPrettyPrinting(x,
		"afPickle::SerA {
		   i=12345
		   f=sys::Float(\"INF\")
		   nList=[2,3]
		   kids=[,]
		 }")

		x.kids.add(SerA.make)
		verifyPrettyPrinting(x,
		"afPickle::SerA {
		   i=12345
		   f=sys::Float(\"INF\")
		   nList=[2,3]
		   kids=[
		     afPickle::SerA
		   ]
		 }")

		x.kids[0].d = 5min
		verifyPrettyPrinting(x,
		"afPickle::SerA {
		   i=12345
		   f=sys::Float(\"INF\")
		   nList=[2,3]
		   kids=[
		     afPickle::SerA {
		       d=5min
		     }
		   ]
		 }")

		x.kids.add(SerB.make)
		x.kids.add(SerA.make)
		verifyPrettyPrinting(x,
		"afPickle::SerA {
		   i=12345
		   f=sys::Float(\"INF\")
		   nList=[2,3]
		   kids=[
		     afPickle::SerA {
		       d=5min
		     },
		     afPickle::SerB,
		     afPickle::SerA
		   ]
		 }")

		x.kids[2].kids = [SerA.make]
		verifyPrettyPrinting(x,
		"afPickle::SerA {
		   i=12345
		   f=sys::Float(\"INF\")
		   nList=[2,3]
		   kids=[
		     afPickle::SerA {
		       d=5min
		     },
		     afPickle::SerB,
		     afPickle::SerA {
		       kids=[
		         afPickle::SerA
		       ]
		     }
		   ]
		 }")

	}

	Void verifyPrettyPrinting(Obj obj, Str expected) {
		opts := ["indent":2, "skipDefaults":true, "using":null]
		actual := pickleWrite(obj, opts)
//echo("================")
//echo(actual)
		verifyEq(expected, actual)

		x := pickleRead(actual.in)
		verifyEq(x, obj)

	}

//////////////////////////////////////////////////////////////////////////
// Skip Errors
//////////////////////////////////////////////////////////////////////////

	Void testSkipErrors() {
		verifySkipErrors(
			 Obj?[SerA.make,this,SerA.make],
			 "sys::Obj?[afPickle::SerA,null /* Not serializable: ${Type.of(this).qname} */,afPickle::SerA]",
			 Obj?[SerA.make,null,SerA.make])
	}

	Void verifySkipErrors(Obj obj, Str expectedStr, Obj expected) {
		verifyErr(IOErr#) { pickleWrite(obj) }

		opts := ["skipDefaults":true, "skipErrors":true]
		actual := pickleWrite(obj, opts)
		verifyEq(expectedStr, actual)

		x := pickleRead(actual.in)
		verifyEq(x, expected)
	}

//////////////////////////////////////////////////////////////////////////
// Type/Slot Literals Boundary Conditions
//////////////////////////////////////////////////////////////////////////

	Void testTypeSlotLiterals() {
		x := SerTypeSlotLiterals()
		s := pickleWrite(x)

		y := pickleRead(s.in) as SerTypeSlotLiterals
		verifyEq(y.a, Str#)
		verifyEq(y.b, 77)
		verifyEq(y.c, Int#plus)
		verifyEq(y.d, Str#replace)
		verifyEq(y.e, SerTypeSlotLiterals#)
		verifyEq(y.f, SerTypeSlotLiterals#f)
		verifyEq(y.g, 88)

		SerTypeSlotLiterals z :=
	 pickleRead(
		"""using sys
		   		using afPickle
		   		SerTypeSlotLiterals { c = Duration#make; a = InStream#; d = Test#verify }""".in)
		verifyEq(z.a, InStream#)
		verifyEq(z.c, Duration#make)
		verifyEq(z.d, Test#verify)
	}

//////////////////////////////////////////////////////////////////////////
// Misc
//////////////////////////////////////////////////////////////////////////

	Void testMisc2726() {
		val := [6:[6:6]]
		str := pickleWrite(val)
		verifyEq(pickleRead(str.in), val)
	}

//////////////////////////////////////////////////////////////////////////
// Utils
//////////////////////////////////////////////////////////////////////////

	Obj? verifySer(Str data, Obj? expected, Str:Obj opts := ["indent":2]) {
//echo("===================")
//echo(data)
		// verify InStream
		x := pickleRead(data.in)
//if (x != null) dump(x, expected)
		verifyEq(x, expected)

		// verify pickleWrite via round trip
		doc := pickleWrite(expected, opts)
//echo("-------------------")
//echo(doc)
		z := pickleRead(Buf.make.print(doc).flip.in)
		verifyEq(z, expected)

		// verify StrBuf
		sb := pickleWrite(expected)
		verifyEq(pickleRead(sb.in), expected)

		return x
	}

	static Void dump(Obj x, Obj y) {
		echo("--- Serialization Dump ---")
		echo("${Type.of(x)} ?= ${Type.of(y)}")
		//echo("$x ?= $y	=>	${x==y}")
		Type.of(x).fields.each |Field f| {
			a := f.get(x)
			b := f.get(y)
			cond := a == b ? "==" : "!="
			at := a == null ? "null" : Type.of(a).signature
			bt := b == null ? "null" : Type.of(b).signature
			echo("$f.name $a $cond $b ($at $cond $bt)")
		}
	}

	const Bool js := Env.cur.runtime == "js"
	
	Obj? pickleRead(InStream in, [Str:Obj?]? opts := null) {
		Pickle.readObjFromIn(in, opts)
	}

	Str pickleWrite(Obj? obj, [Str:Obj?]? opts := null) {
		Pickle.writeObj(obj, opts)
	}
}

**************************************************************************
** SerA
**************************************************************************

@Js
@Serializable
class SerA {
	new make(Str? s := null, Duration? d := null) {
		this.s = s
		this.d = d
	}

	override Int hash() {
		return i.hash.xor(f.hash)
	}

	override Bool equals(Obj? obj) {
		if (this === obj) return true
		x := obj as SerA
		if (x == null) return false
		eq := b == x.b &&
					i == x.i &&
					f == x.f &&
					s == x.s &&
					d == x.d &&
					u == x.u &&
					sList == x.sList &&
					nList == x.nList &&
					isMap == x.isMap &&
					kids == x.kids
		// if (!eq) SerializationTest.dump(this, x)
		return eq
	}

	Bool b := true
	Int i := 7
	Float f := 5f
	Str? s
	Duration? d
	Uri? u
	Str[]? sList
	Num[]? nList
	[Int:Str]? isMap
	SerA[]? kids
	@Transient Str skip := "skip"
}

**************************************************************************
** SerB
**************************************************************************

@Js
@Serializable
class SerB : SerA {
	new make() : super.make(null, null) {}
	override Bool equals(Obj? obj) {
		x := obj as SerB
		if (x == null) return false
		if (!super.equals(obj)) return false
		eq := z == x.z
		return eq
	}

	Int z := 'x'
}

**************************************************************************
** SerConst
**************************************************************************

@Js
@Serializable
const class SerConst {
	new make(Int a := 0, Int[]? b := null, Int[][]? c := null) {
		this.a = a
		if (b != null) this.b = b.toImmutable
		if (c != null) this.c = c.toImmutable
	}

	override Int hash() {
		return a.hash
	}

	override Bool equals(Obj? obj) {
		x := obj as SerConst
		if (x == null) return false
		return x.a == a && x.b == b && x.c == c
	}

	override Str toStr() {
		return "a=$a b=$b c=$c"
	}

	const Int a
	const Int[]? b
	const Int[][]? c
}

**************************************************************************
** SerListMap
**************************************************************************

@Js
@Serializable
class SerListMap {
	override Int hash() { return map.hash }

	override Bool equals(Obj? obj) {
		x := obj as SerListMap
		if (x == null) return false
		return x.list == list && Type.of(x.list) == Type.of(list) &&
					x.map == map && Type.of(x.map) == Type.of(map)
	}

	override Str toStr() {
		return Pickle.writeObj(this)
	}

	Int[] list := Int[,]
	Str:Obj map := Str:Obj[:]
}

**************************************************************************
** SerSimple
**************************************************************************

@Js
@Serializable { simple = true }
class SerSimple {
	static SerSimple fromStr(Str s) {
		return make(s[0..<s.index(",")].toInt, s[s.index(",")+1..-1].toInt)
	}
	new make(Int a, Int b) { this.a = a; this.b = b }
	override Str toStr() { return "$a,$b" }
	override Int hash() { return a.xor(b) }
	override Bool equals(Obj? obj) {
		if (obj isnot SerSimple) return false
		return a == obj->a && b == obj->b
	}
	Int a
	Int b
}

**************************************************************************
** SerSynthetic
**************************************************************************

@Js
@Serializable
class SerSynthetic {
	new make(Int a := 3) { this.a = a }
	Int a
	once Int b() { return a + 1 }

	override Int hash() { return a }
	override Bool equals(Obj? obj) { return a == obj->a }
	override Str toStr() { return "a=$a" }
}

**************************************************************************
** SerIntCollection
**************************************************************************

@Js
@Serializable { collection = true }
class SerIntCollection {
	This add(Int i) { list.add(i); return this }
	Void each(|Int i| f) { list.each(f) }
	override Int hash() { return list.hash }
	override Bool equals(Obj? obj) {
		if (obj isnot SerIntCollection) return false
		return name == obj->name && list == obj->list
	}
	override Str toStr() { return name + " " + list.toStr }
	Str? name
	@Transient Int[] list := Int[,]
}

**************************************************************************
** SerFolder
**************************************************************************

@Js
@Serializable { collection = true }
class SerFolder {
	@Operator This add(SerFolder x) { list.add(x); return this }
	Void each(|SerFolder i| f) { list.each(f) }
	override Int hash() { return list.hash }
	override Bool equals(Obj? obj) {
		if (obj isnot SerFolder) return false
		return name == obj->name && list == obj->list
	}
	override Str toStr() { return name + " " + list.toStr }
	Str? name
	@Transient SerFolder[] list := SerFolder[,]
}

**************************************************************************
** SerItBlock
**************************************************************************

@Js
@Serializable
const class SerItBlock {
	new make(|This|? f) {
		f?.call(this)
		if ((Obj?)b == null) b = "unset"
	}
	const Str a
	const Str b
	const Str? c
	const Int[]? d
	override Int hash() { a.hash }
	override Bool equals(Obj? obj) {
		if (obj isnot SerItBlock) return false
		return a == obj->a && b == obj->b && c == obj->c && d == obj->d
	}
}

**************************************************************************
** SerParamsAndItBlock
**************************************************************************

@Js
@Serializable
const class SerParamsAndItBlock {
	new make(Str a, Int b, |This|? f) {
		this.a = a
		this.b = b
		f?.call(this)
	}
	const Str a
	const Int b
	const Str? c
	const Int? d
	override Int hash() { a.hash }
	override Bool equals(Obj? obj) {
		if (obj isnot SerParamsAndItBlock) return false
		return a == obj->a && b == obj->b && c == obj->c && d == obj->d
	}
}

**************************************************************************
** SerCollectionInference
**************************************************************************

@Js
@Serializable
class SerCollectionInference {
	Str[]? a
	Num?[]? b
	[Str:Num]? x
	[Uri:Str?]? y
	Obj? w
}

**************************************************************************
** SerCollectionInference
**************************************************************************

@Js
@Serializable
class SerTypeSlotLiterals {
	Type a := Str#
	Int	b := 77
	Slot c := Int#plus
	Slot d := Str#replace
	Type e := SerTypeSlotLiterals#
	Slot f :=	SerTypeSlotLiterals#f
	Int	g := 88
}

//////////////////////////////////////////////////////////////////////////
// from EnumTest.fan
//////////////////////////////////////////////////////////////////////////

@Js 
internal enum class EnumAbc {
	A, B, C

	Int negOrdinal() { return -ordinal }

	static const EnumAbc first := A
}

@Js facet class FacetS1 {
	const Str val := "alpha"
}

@Js
@FacetS1 { val = "y" }
enum class Suits {
	clubs("black"),
	diamonds("red"),
	hearts("red"),
	spades("black")

	private new make(Str color) { this.color = color; }

	const Str color;
}

@Js
internal class StrBufWrapOutStream : OutStream {
	new make(OutStream out) : super(out) {}
}
