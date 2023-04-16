
** Pickles Fantom objects to and from strings.
@Js class Pickle {
	
	** Read a pickled object from a string
	** according to the Fantom [serialization format]`docLang::Serialization`.
	**
	** Options may contain:
	**  - '"makeArgs"' - 'Obj[]' - args to pass to the root object's ctor.
	**    Default is 'null'.
	**  - '"makeObjFn"' - '|Type type, Field:Obj? fieldVals->Obj?|' - object creation func.
	**    Default is 'null'.
	** 
	** See docs for a full explanation of all options.
	static Obj? readObj(Str? str, [Str:Obj]? options := null) {
		readObjFromIn(str?.in, options)
	}

	** A stream version of [readObj()]`Pickle.readObj`.
	native static Obj? readObjFromIn(InStream? in, [Str:Obj]? options := null)

	** Pickles an object to a string 
	** according to the Fantom [serialization format]`docLang::Serialization`.
	**
	** The options may be used to specify the format of the output:
	**  - '"indent"' - 'Int' or 'Str' - num of spaces to indent, or the actual indent.
	**    Default is '"\t"'.
	**  - "skipDefaults" - 'Bool' - skip fields with default values. 
	**    Default is 'false'.
	**  - "skipErrors" - 'Bool' - skip objects which aren't serializable.
	**    Default is 'false'.
	**  - "using" - 'Str[]' - List of pod names to emit in using statements, 
	**    '["using":["sys", "afPickle"]]'
	**    Default is 'null'.
	** 
	** See docs for a full explanation of all options.
	static Str writeObj(Obj? obj, [Str:Obj]? options := null) {
		str := StrBuf()
		writeObjToOut(str.out, obj, options)
		return str.toStr
	}
	
	** A stream version of [writeObj()]`Pickle.writeObj`.
	native static Void writeObjToOut(OutStream out, Obj? obj, [Str:Obj]? options := null)
	
}
