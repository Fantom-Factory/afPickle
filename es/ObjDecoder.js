
/**
 * ObjDecoder parses an object tree from an input stream.
 */
class ObjDecoder {

	constructor(input, options) {
		this.tokenizer	= new Tokenizer(input);
		this.options	= options;
		this.curt		= null;
		this.usings		= [];
		this.numUsings	= 0;
		if (input != null)
			this.consume();
	}

	//////////////////////////////////////////////////////////////////////////
	// Parse
	//////////////////////////////////////////////////////////////////////////

	/**
	 * Read an object from the stream.
	 */
	readObj() {
		if (this.tokenizer.input == null)
			return null;
		this.readHeader();
		return this.$readObj(null, null, true);
	}

	/**
	 * header := [using]*
	 */
	readHeader() {
		while (this.curt == Token.USING)
			this.usings[this.numUsings++] = this.readUsing();
	}

	/**
	 * using     := usingPod | usingType | usingAs
	 * usingPod  := "using" podName
	 * usingType := "using" podName::typeName
	 * usingAs   := "using" podName::typeName "as" name
	 */
	readUsing() {
		var line = this.tokenizer.line;
		this.consume();

		var podName = this.consumeId("Expecting pod name");
		var pod = sys.Pod.find(podName, false);
		if (pod == null) throw this.err("Unknown pod: " + podName);
		if (this.curt != Token.DOUBLE_COLON) {
			this.endOfStmt(line);
			return new UsingPod(pod);
		}

		this.consume();
		var typeName = this.consumeId("Expecting type name");
		var t = pod.type(typeName, false);
		if (t == null) throw this.err("Unknown type: " + podName + "::" + typeName);

		if (this.curt == Token.AS) {
			this.consume();
			typeName = this.consumeId("Expecting using as name");
		}

		this.endOfStmt(line);
		return new UsingType(t, typeName);
	}

	/**
	 * obj := literal | simple | complex
	 */
	$readObj(curField, peekType, root) {
		// literals are stand alone
		if (Token.isLiteral(this.curt)) {
			var val = this.tokenizer.val;
			this.consume();
			return val;
		}

		// [ is always list/map collection
		if (this.curt == Token.LBRACKET)
			return this.readCollection(curField, peekType);

		// at this point all remaining options must start
		// with a type signature - if peekType is non-null
		// then we've already read the type signature
		var line = this.tokenizer.line;
		var t = (peekType != null) ? peekType : this.readType();

		// type:     type#
		// simple:   type(
		// list/map: type[
		// complex:  type || type{
		if (this.curt == Token.LPAREN)
			return this.readSimple(line, t);
		else if (this.curt == Token.POUND)
			return this.readTypeOrSlotLiteral(line, t);
		else if (this.curt == Token.LBRACKET)
			return this.readCollection(curField, t);
		else
			return this.readComplex(line, t, root);
	}

	/**
	 * typeLiteral := type "#"
	 * slotLiteral := type "#" id
	 */
	readTypeOrSlotLiteral(line, t) {
		this.consume(Token.POUND, "Expected '#' for type literal");
		if (this.curt == Token.ID && !this.isEndOfStmt(line)) {
			var slotName = this.consumeId("slot literal name");
			return t.slot(slotName);
		}
		else {
			return t;
		}
	}

	/**
	 * simple := type "(" str ")"
	 */
	readSimple(line, t) {
		// parse: type(str)
		this.consume(Token.LPAREN, "Expected ( in simple");
		var str = this.consumeStr("Expected string literal for simple");
		this.consume(Token.RPAREN, "Expected ) in simple");

		try {
			const val = t.method("fromStr").invoke(null, [str]);
			return val;
		}
		catch (e) {
			throw sys.ParseErr.make(e.toString() + " [Line " + this.line + "]", e);
		}

		// lookup the fromString method
	// TODO
	//    t.finish();
	//    Method m = t.method("fromStr", false);
	//    if (m == null)
	//      throw err("Missing method: " + t.qname() + ".fromStr", line);
	//
	//    // invoke parse method to translate into instance
	//    try {
	//      return m.invoke(null, new Object[] { str });
	//    }
	//    catch (sys.ParseErr.Val e) {
	//      throw sys.ParseErr.make(e.err().msg() + " [Line " + line + "]").val;
	//    }
	//    catch (Throwable e) {
	//      throw sys.ParseErr.make(e.toString() + " [Line " + line + "]", e).val;
	//    }
	}

	//////////////////////////////////////////////////////////////////////////
	// Complex
	//////////////////////////////////////////////////////////////////////////

	/**
	 * complex := type [fields]
	 * fields  := "{" field (eos field)* "}"
	 * field   := name "=" obj
	 */
	readComplex(line, t, root) {
		var toSet = sys.Map.make(sys.Field.type$, sys.Obj.type$.toNullable());
		var toAdd = sys.List.make(sys.Obj.type$.toNullable());

		// read fields/collection into toSet/toAdd
		this.readComplexFields(t, toSet, toAdd);
		
		var obj = null;

		if (this.options != null && this.options.get("makeObjFn") != null) {

			// delegate to dedicated obj construction func
			var makeObjFn = this.options.get("makeObjFn");
			obj = makeObjFn(t, toSet);

		} else {

			// get the make constructor
			var makeCtor = t.method("make", false);
			if (makeCtor == null || !makeCtor.isPublic())
				throw this.err("Missing public constructor " + t.qname() + ".make", line);

			// get argument lists
			var args = null;
			if (root && this.options != null && this.options.get("makeArgs") != null)
				args = sys.List.make(sys.Obj.type$).addAll(this.options.get("makeArgs") || []);

			// construct object
			var setAfterCtor = true;
			try {
				// if last parameter is an function then pass toSet
				// as an it-block for setting the fields
				var p = makeCtor.params().last();
				if (p != null && p.type().fits(sys.Func.type$)) {
					if (args == null) args = sys.List.make(sys.Obj.type$);
					args.add(sys.Field.makeSetFunc(toSet));
					setAfterCtor = false;
				}

				// invoke make to construct object
				obj = makeCtor.callList(args);
			}
			catch (e) {
				throw this.err("Cannot make " + t + ": " + e, line, e);
			}

			// set fields (if not passed to ctor as it-block)
			if (setAfterCtor && toSet.size() > 0) {
				var keys = toSet.keys();
				for (var i=0; i<keys.size(); i++) {
					var field = keys.get(i);
					var val = toSet.get(field);
					this.complexSet(obj, field, val, line);
				}
			}
		}
		
		// add
		if (toAdd.size() > 0) {
			var addMethod = t.method("add", false);
			if (addMethod == null) throw this.err("Method not found: " + t.qname() + ".add", line);
			for (var i=0; i<toAdd.size(); ++i)
				this.complexAdd(t, obj, addMethod, toAdd.get(i), line);
		}

		return obj;
	}

	readComplexFields(t, toSet, toAdd) {
		if (this.curt != Token.LBRACE) return;
		this.consume();

		// fields and/or collection items
		while (this.curt != Token.RBRACE) {
			// try to read "id =" to see if we have a field
			var line = this.tokenizer.line;
			var readField = false;
			if (this.curt == Token.ID) {
				var name = this.consumeId("Expected field name");
				if (this.curt == Token.EQ) {
					// we have "id =" so read field
					this.consume();
					this.readComplexSet(t, line, name, toSet);
					readField = true;
				}
				else {
					// pushback to reset on start of collection item
					this.tokenizer.undo(this.tokenizer.type, this.tokenizer.val, this.tokenizer.line);
					this.curt = this.tokenizer.reset(Token.ID, name, line);
				}
			}

			// if we didn't read a field, we assume a collection item
			if (!readField) this.readComplexAdd(t, line, toAdd);

			if (this.curt == Token.COMMA) this.consume();
			else this.endOfStmt(line);
		}
		this.consume(Token.RBRACE, "Expected '}'");
	}

	readComplexSet(t, line, name, toSet) {
		// resolve field
		var field = t.field(name, false);
		if (field == null) throw this.err("Field not found: " + t.qname() + "." + name, line);

		// parse value
		var val = this.$readObj(field, null, false);

		try {
			// if const field, then make val immutable
			if (field.isConst()) val = sys.ObjUtil.toImmutable(val);
		}
		catch (ex) {
			throw this.err("Cannot make object const for " + field.qname() + ": " + ex, line, ex);
		}

		// add to map
		toSet.set(field, val);
	}

	complexSet(obj, field, val, line) {
		try {
			if (field.isConst())
				field.set(obj, sys.ObjUtil.toImmutable(val), false);
			else
				field.set(obj, val);
		}
		catch (ex) {
			throw this.err("Cannot set field " + field.qname() + ": " + ex, line, ex);
		}
	}

	readComplexAdd(t, line, toAdd) {
		var val = this.$readObj(null, null, false);

		// add to list
		toAdd.add(val);
	}

	complexAdd(t, obj, addMethod, val, line) {
		try {
			addMethod.invoke(obj, sys.List.make(sys.Obj.type$, [val]));
		}
		catch (ex) {
			throw this.err("Cannot call " + t.qname() + ".add: " + ex, line, ex);
		}
	}

	//////////////////////////////////////////////////////////////////////////
	// Collection
	//////////////////////////////////////////////////////////////////////////

	/**
	 * collection := list | map
	 */
	readCollection(curField, t) {
		// opening [
		this.consume(Token.LBRACKET, "Expecting '['");

		// if this could be a map type signature:
		//    [qname:qname]
		//    [qname:qname][]
		//    [qname:qname][][] ...
		// or it could just be the type signature of
		// of a embedded simple, complex, or list
		var peekType = null;
		if (this.curt == Token.ID && t == null) {
			// peek at the type
			peekType = this.readType();

			// if we have [mapType] then this is non-inferred type signature
			if (this.curt == Token.RBRACKET && this.isMapType(peekType)) {
				t = peekType; peekType = null;
				this.consume();
				while (this.curt == Token.LRBRACKET) { this.consume(); t = t.toListOf(); }
				if (this.curt == Token.QUESTION) { this.consume(); t = t.toNullable(); }
				if (this.curt == Token.POUND) { this.consume(); return t; }
				this.consume(Token.LBRACKET, "Expecting '['");
			}

			// if the type was a FFI JavaType, this isn't a collection
	//    if (peekType != null && peekType.isJava())
	//      return this.$readObj(curField, peekType, false);
		}

		// handle special case of [,]
		if (this.curt == Token.COMMA && peekType == null) {
			this.consume();
			this.consume(Token.RBRACKET, "Expecting ']'");
			return sys.List.make(this.toListOfType(t, curField, false), []);
		}

		// handle special case of [:]
		if (this.curt == Token.COLON && peekType == null) {
			this.consume();
			this.consume(Token.RBRACKET, "Expecting ']'");
			return sys.Map.make(this.toMapType(t, curField, false));
		}

		// read first list item or first map key
		var first = this.$readObj(null, peekType, false);

		// now we can distinguish b/w list and map
		if (this.curt == Token.COLON)
			return this.readMap(this.toMapType(t, curField, true), first);
		else
			return this.readList(this.toListOfType(t, curField, true), first);
	}

	/**
	 * list := "[" obj ("," obj)* "]"
	 */
	readList(of, first) {
		// setup accumulator
		var acc = [];
		acc.push(first)

		// parse list items
		while (this.curt != Token.RBRACKET) {
			this.consume(Token.COMMA, "Expected ','");
			if (this.curt == Token.RBRACKET) break;
			acc.push(this.$readObj(null, null, false));
		}
		this.consume(Token.RBRACKET, "Expected ']'");

		// infer type if needed
		if (of == null) of = sys.Type.common$(acc);

		return sys.List.make(of, acc);
	}

	/**
	 * map     := "[" mapPair ("," mapPair)* "]"
	 * mapPair := obj ":" + obj
	 */
	readMap(mapType, firstKey) {
		// create map
		var map = mapType == null
			? sys.Map.make(sys.Obj.type$, sys.Obj.type$.toNullable())
			: sys.Map.make(mapType);

		// we don't encode whether the original map was ordered or not,
		// so assume it was to ensure map is still ordered after decode
		map.ordered(true);

		// finish first pair
		this.consume(Token.COLON, "Expected ':'");
		map.set(firstKey, this.$readObj(null, null, false));

		// parse map pairs
		while (this.curt != Token.RBRACKET) {
			this.consume(Token.COMMA, "Expected ','");
			if (this.curt == Token.RBRACKET) break;
			var key = this.$readObj(null, null, false);
			this.consume(Token.COLON, "Expected ':'");
			var val = this.$readObj(null, null, false);
			map.set(key, val);
		}
		this.consume(Token.RBRACKET, "Expected ']'");

		// infer type if necessary
		if (mapType == null) {
			var size = map.size();
			var k = sys.Type.common$(map.keys().__values());
			var v = sys.Type.common$(map.vals().__values());
			map.__type(this.newMapType(k, v));
		}

		return map;
	}

	/**
	 * Figure out the type of the list:
	 *   1) if t was explicit then use it
	 *   2) if we have field typed as a list, then use its definition
	 *   3) if inferred is false, then drop back to list of Obj
	 *   4) If inferred is true then return null and we'll infer the common type
	 */
	toListOfType(t, curField, infer) {
		if (t != null) return t;
		if (curField != null) {
			var ft = curField.type().toNonNullable();
			if (this.isListType(ft)) return ft.v;
		}
		if (infer) return null;
		return sys.Obj.type$.toNullable();
	}

	/**
	 * Figure out the map type:
	 *   1) if t was explicit then use it (check that it was a map type)
	 *   2) if we have field typed as a map , then use its definition
	 *   3) if inferred is false, then drop back to Obj:Obj
	 *   4) If inferred is true then return null and we'll infer the common key/val types
	 */
	toMapType(t, curField, infer) {
		if (this.isMapType(t))
			return t;

		if (curField != null) {
			var ft = curField.type().toNonNullable();
			if (this.isMapType(ft)) return ft;
		}

		if (infer) return null;

		if (ObjDecoder.defaultMapType == null)
			ObjDecoder.defaultMapType =
				this.newMapType(sys.Obj.type$, sys.Obj.type$.toNullable());
		return ObjDecoder.defaultMapType;
	}

	//////////////////////////////////////////////////////////////////////////
	// Type
	//////////////////////////////////////////////////////////////////////////

	/**
	 * type    := listSig | mapSig1 | mapSig2 | qname
	 * listSig := type "[]"
	 * mapSig1 := type ":" type
	 * mapSig2 := "[" type ":" type "]"
	 *
	 * Note: the mapSig2 with brackets is handled by the
	 * method succinctly named readMapTypeOrCollection().
	 */
	readType(lbracket) {
		if (lbracket === undefined) lbracket = false;
		var t = this.readSimpleType();
		if (this.curt == Token.QUESTION) {
			this.consume();
			t = t.toNullable();
		}
		if (this.curt == Token.COLON) {
			this.consume();
			var lbracket2 = this.curt == Token.LBRACKET;
			if (lbracket2) this.consume();
			t = this.newMapType(t, this.readType(lbracket2));
			if (lbracket2) this.consume(Token.RBRACKET, "Expected closing ']'");
		}
		while (this.curt == Token.LRBRACKET) {
			this.consume();
			t = t.toListOf();
		}
		if (this.curt == Token.QUESTION) {
			this.consume();
			t = t.toNullable();
		}
		return t;
	}

	/**
	 * qname := [podName "::"] typeName
	 */
	readSimpleType() {
		// parse identifier
		var line = this.tokenizer.line;
		var n = this.consumeId("Expected type signature");

		// check for using imported name
		if (this.curt != Token.DOUBLE_COLON) {
			for (var i=0; i<this.numUsings; ++i) {
				var t = this.usings[i].resolve(n);
				if (t != null) return t;
			}
			throw this.err("Unresolved type name: " + n);
		}

		// must be fully qualified
		this.consume(Token.DOUBLE_COLON, "Expected ::");
		var typeName = this.consumeId("Expected type name");

		// resolve pod
		var pod = sys.Pod.find(n, false);
		if (pod == null) throw this.err("Pod not found: " + n, line);

		// resolve type
		var type = pod.type(typeName, false);
		if (type == null) throw this.err("Type not found: " + n + "::" + typeName, line);
		return type;
	}

	//////////////////////////////////////////////////////////////////////////
	// Error Handling
	//////////////////////////////////////////////////////////////////////////

	/**
	 * Create exception based on tokenizers current line.
	 */
	err(msg) {
		return ObjDecoder.err(msg, this.tokenizer.line);
	}

	//////////////////////////////////////////////////////////////////////////
	// Tokens
	//////////////////////////////////////////////////////////////////////////

	/**
	 * Consume the current token as a identifier.
	 */
	consumeId(expected) {
		this.verify(Token.ID, expected);
		var id = this.tokenizer.val;
		this.consume();
		return id;
	}

	/**
	 * Consume the current token as a String literal.
	 */
	consumeStr(expected) {
		this.verify(Token.STR_LITERAL, expected);
		var id = this.tokenizer.val;
		this.consume();
		return id;
	}

	/**
	 * Check that the current token matches the
	 * specified type, and then consume it.
	 */
	consume(type, expected) {
		if (type != undefined)
			this.verify(type, expected);
		this.curt = this.tokenizer.next();
	}

	/**
	 * Check that the current token matches the specified
	 * type, but do not consume it.
	 */
	verify(type, expected) {
		if (this.curt != type)
			throw this.err(expected + ", not '" + Token.toString(this.curt) + "'");
	}

	/**
	 * Is current token part of the next statement?
	 */
	isEndOfStmt(lastLine) {
		if (this.curt == Token.EOF) return true;
		if (this.curt == Token.SEMICOLON) return true;
		return lastLine < this.tokenizer.line;
	}

	/**
	 * Statements can be terminated with a semicolon, end of line or } end of block.
	 */
	endOfStmt(lastLine) {
		if (this.curt == Token.SEMICOLON) { this.consume(); return; }
		if (lastLine < this.tokenizer.line) return;
		if (this.curt == Token.RBRACE) return;
		throw this.err("Expected end of statement: semicolon, newline, or end of block; not '" + Token.toString(this.curt) + "'");
	}

	//////////////////////////////////////////////////////////////////////////
	// Static
	//////////////////////////////////////////////////////////////////////////

	static decode(s) {
		return new ObjDecoder(InStream.__makeForStr(s), null).readObj();
	}

	static err(msg, line) {
		return sys.IOErr.make(msg + " [Line " + line + "]");
	}

	static defaultMapType = null;



	// ====
	// Some Sweet SlimerDude Fudge
	// ====
	// sys.ListType and sys.MapType are NOT exported, so here are some workarounds

	// an alternative to 'obj instanceof ListType'
	isListType(obj) {
		if (obj == null) return false;
		return obj.signature().endsWith("[]");
	}

	// an alternative to 'obj instanceof MapType'
	isMapType(obj) {
		if (obj == null) return false;
		let sig = obj.signature();
		return sig.startsWith("[") && sig.endsWith("]");
	}

	// an alternative to 'new MapType()'
	newMapType(k, v) {
		return sys.Map.type$.parameterize(
			new Map().set("K", k).set("V", v)
		);
	}
}



//////////////////////////////////////////////////////////////////////////
// Using
//////////////////////////////////////////////////////////////////////////

class UsingPod {
	constructor(p) {
		this.pod = p;
	}
	
	resolve(n) {
		return this.pod.type(n, false);
	}
}

class UsingType {
	constructor(t,n) {
		this.type = t;
		this.name = n;
	}
	
	resolve(n) {
		return this.name == n ? this.type : null;
	}
}
