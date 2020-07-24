
** Pickles Fantom objects to and from strings.
@Js class Pickle {
	
	** Read a pickled object from a string
	** according to the Fantom [serialization format]`docLang::Serialization`.
	**
	** Options may contain:
	**  - '"makeArgs"' - 'Obj[]' - args to pass to the root object's ctor
	**  - '"makeObjFn"' - '|Type type, Field:Obj? fieldVals->Obj?|' - object creation func.
	** 
	** See docs for a full explanation of all options.
	static Obj? readObj(Str str, [Str:Obj]? options := null) {
		readObjFromIn(str.in, options)
	}

	** A stream version of `readObj`.
	native static Obj? readObjFromIn(InStream in, [Str:Obj]? options := null)

	** Pickles an object to a string 
	** according to the Fantom [serialization format]`docLang::Serialization`.
	**
	** The options may be used to specify the format of the output:
	**   - "indent": Int specifies how many spaces to indent
	**     each level.  Or a string defines the actual indent. Default is "\t".
	**   - "skipDefaults": Bool specifies if we should skip fields
	**     at their default values.  Field values are compared according
	**     to the 'equals' method.  Default is false.
	**   - "skipErrors": Bool specifies if we should skip objects which
	**     aren't serializable. If true then we output null and a comment.
	**     Default is false.
	**   - "usings": List of strings that specify pod names to use, 
	**     example: '["usings":["sys", "afPickle"]]'
	**     Default is an empty list.
	** 
	** See docs for a full explanation of all options.
	static Str writeObj(Obj? obj, [Str:Obj]? options := null) {
		str := StrBuf()
		writeObjToOut(str.out, obj, options)
		return str.toStr
	}
	
	** A stream version of `writeObj`.
	native static Void writeObjToOut(OutStream out, Obj? obj, [Str:Obj]? options := null)
	
}
