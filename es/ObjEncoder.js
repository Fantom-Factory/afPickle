
/**
 * ObjEncoder serializes an object to an output stream.
 */
class ObjEncoder {

	constructor(out, options) {
		this.out			= out;
		this.level			= 0;
		this.indent			= "\t";
		this.skipDefaults	= false;
		this.skipErrors		= false;
		this.skipNulls		= false;
		this.curFieldType	= null;
		this.defaultObjs	= null;
		this.usings			= null;	

		if (options != null) this.initOptions(options);
		else this.usings	= sys.List.make(sys.Str.type$, []);

		if (this.usings.size() > 0) {
			this.usings.each((val) => {
				this.w("using ").w(val).w("\n");
			});
			this.w("\n");
		}
	}

	//////////////////////////////////////////////////////////////////////////
	// Static
	//////////////////////////////////////////////////////////////////////////

	static encode(obj) {
		var buf = StrBuf.make();
		var out = new StrBufOutStream(buf);
		new ObjEncoder(out, null).writeObj(obj);
		return buf.toStr();
	}

	//////////////////////////////////////////////////////////////////////////
	// Write
	//////////////////////////////////////////////////////////////////////////

	writeObj(obj) {
		if (obj == null) {
			this.w("null");
			return;
		}

		var t = typeof obj;
		if (t === "boolean") { this.w(obj.toString()); return; }
		if (t === "number")  { this.w(obj.toString()); return; }
		if (t === "string")  { this.wStrLiteral(obj.toString(), '"'); return; }

		var f = obj.fanType$;
		if (f === sys.Float.type$)   { sys.Float.encode(obj, this); return; }
		if (f === sys.Decimal.type$) { sys.Decimal.encode(obj, this); return; }

		if (obj.literalEncode$) {
			obj.literalEncode$(this);
			return;
		}
		var type = sys.ObjUtil.typeof(obj);
		var ser = type.facet(sys.Serializable.type$, false);
		if (ser != null) {
			if (ser.simple())
				this.writeSimple(type, obj);
			else
				this.writeComplex(type, obj, ser);
		}
		else {
			if (this.skipErrors) // NOTE: /* not playing nice in str - escape as unicode char */
				this.w("null /\u002A Not serializable: ").w(type.qname()).w(" */");
			else
				throw sys.IOErr.make("Not serializable: " + type);
		}
	}

	//////////////////////////////////////////////////////////////////////////
	// Simple
	//////////////////////////////////////////////////////////////////////////

	writeSimple(type, obj) {
		var str = sys.ObjUtil.toStr(obj);
		this.wType(type).w('(').wStrLiteral(str, '"').w(')');
	}

	//////////////////////////////////////////////////////////////////////////
	// Complex
	//////////////////////////////////////////////////////////////////////////

	writeComplex(type, obj, ser) {
		this.wType(type);

		var first = true;
		var defObj = null;
		if (this.skipDefaults) {
			var defType = sys.ObjUtil.typeof(obj).toNonNullable();
			if (this.defaultObjs[defType] != undefined)
				// use cached defObj if it exists
				defObj = this.defaultObjs[defType];
			else {
				// else attempt to instantiate default object for type,
				// this will fail if complex has it-block ctor
				try { defObj = sys.ObjUtil.typeof(obj).make(); } catch(e) {}
				this.defaultObjs[defType] = defObj;
			}
		}

		var fields = type.fields();
		for (var i=0; i<fields.size(); ++i) {
			var f = fields.get(i);

			// skip static, transient, and synthetic (once) fields
			if (f.isStatic() || f.isSynthetic() || f.hasFacet(sys.Transient.type$))
				continue;

			// get the value
			var val = f.get(obj);

			// if skipping defaults
			if (defObj != null) {
				var defVal = f.get(defObj);
				if (sys.ObjUtil.equals(val, defVal)) continue;
			}

			// if skipping nulls
			if (this.skipNulls && val == null)
				continue;

			// if first then open braces
			if (first) { this.w(' ').w('{').w('\n'); this.level++; first = false; }

			// field name =
			this.wIndent().w(f.name()).w('=');

			// field value
			this.curFieldType = f.type().toNonNullable();
			this.writeObj(val);
			this.curFieldType = null;

			this.w('\n');
		}

		// if collection
		if (ser.collection())
			first = this.writeCollectionItems(type, obj, first);

		// if we output fields, then close braces
		if (!first) { this.level--; this.wIndent().w('}'); }
	}

	//////////////////////////////////////////////////////////////////////////
	// Collection (@collection)
	//////////////////////////////////////////////////////////////////////////

	writeCollectionItems(type, obj, first) {
		// lookup each method
		var m = type.method("each", false);
		if (m == null) throw sys.IOErr.make("Missing " + type.qname() + ".each");

		// call each(it)
		var enc = this;
		/*
		var it  = sys.Func.make(
			sys.List.make(Param.type$),
			Void.type$,
			function(obj) {
				if (first) { enc.w('\n').wIndent().w('{').w('\n'); enc.level++; first = false; }
				enc.wIndent();
				enc.writeObj(obj);
				enc.w(',').w('\n');
				return null;
			});
			*/

		const it = (obj) => {
			if (first) { enc.w('\n').wIndent().w('{').w('\n'); enc.level++; first = false; }
			enc.wIndent();
			enc.writeObj(obj);
			enc.w(',').w('\n');
			return null;
		}

		m.invoke(obj, sys.List.make(sys.Obj.type$, [it]));
		return first;
	}

	//////////////////////////////////////////////////////////////////////////
	// List
	//////////////////////////////////////////////////////////////////////////

	writeList(list) {
		// get of type
		var of = list.of();

		// decide if we're going output as single or multi-line format
		var nl = this.isMultiLine(of);

		// figure out if we can use an inferred type
		var inferred = false;
		if (this.curFieldType != null && (this.isListType(this.curFieldType))) {
			inferred = true;
		}

		// clear field type, so it doesn't get used for inference again
		this.curFieldType = null;

		// if we don't have an inferred type, then prefix of type
		if (!inferred) this.wType(of);

		// handle empty list
		var size = list.size();
		if (size == 0) { this.w("[,]"); return; }

		// items
		this.w('[');
		this.level++;
		for (var i=0; i<size; ++i) {
			if (i > 0) this.w(',');
			 if (nl) this.w('\n').wIndent();
			this.writeObj(list.get(i));
		}
		this.level--;
		if (nl) this.w('\n').wIndent();
		this.w(']');
	}

	//////////////////////////////////////////////////////////////////////////
	// Map
	//////////////////////////////////////////////////////////////////////////

	writeMap(map) {
		// get k,v type
		var t = map.typeof();

		// decide if we're going output as single or multi-line format
		var nl = this.isMultiLine(t.k) || this.isMultiLine(t.v);

		// figure out if we can use an inferred type
		var inferred = false;
		if (this.curFieldType != null && (this.isMapType(this.curFieldType))) {
			inferred = true;
		}

		// clear field type, so it doesn't get used for inference again
		this.curFieldType = null;

		// if we don't have an inferred type, then prefix of type
		if (!inferred) this.wType(t);

		// handle empty map
		if (map.isEmpty()) { this.w("[:]"); return; }

		// items
		this.level++;
		this.w('[');
		var first = true;
		var keys = map.keys();
		for (var i=0; i<keys.size(); i++) {
			if (first) first = false; else this.w(',');
			if (nl) this.w('\n').wIndent();
			var key = keys.get(i);
			var val = map.get(key);
			this.writeObj(key); this.w(':'); this.writeObj(val);
		}
		this.w(']');
		this.level--;
	}

	isMultiLine(t) {
		return t.pod() != sys.Pod.sysPod$;
	}

	//////////////////////////////////////////////////////////////////////////
	// Output
	//////////////////////////////////////////////////////////////////////////

	wType(t) {
		return this.usings.contains(t.pod().name())
			? this.w(t.signature().split(t.pod().name() + "::").join(""))
			: this.w(t.signature());
	}

	wStrLiteral(s, quote) {
		var len = s.length;
		this.w(quote);
		// NOTE: these escape sequences are duplicated in FanStr.toCode()
		for (var i=0; i<len; ++i) {
			var c = s.charAt(i);
			switch (c) {
				case '\n': this.w('\\').w('n'); break;
				case '\r': this.w('\\').w('r'); break;
				case '\f': this.w('\\').w('f'); break;
				case '\t': this.w('\\').w('t'); break;
				case '\\': this.w('\\').w('\\'); break;
				case '"':  if (quote == '"') this.w('\\').w('"'); else this.w(c); break;
				case '`':  if (quote == '`') this.w('\\').w('`'); else this.w(c); break;
				case '$':  this.w('\\').w('$'); break;
				default:   this.w(c);
			}
		}
		return this.w(quote);
	}

	wIndent() {
		for (var i=0; i<this.level; ++i) this.w(this.indent);
		return this;
	}

	w(s) {
		var len = s.length;
		for (var i=0; i<len; ++i)
			this.out.writeChar(s.charCodeAt(i));
		return this;
	}

	//////////////////////////////////////////////////////////////////////////
	// Options
	//////////////////////////////////////////////////////////////////////////

	initOptions(options) {
		this.indent			= options.get("indent",			this.indent);
		this.skipDefaults	= options.get("skipDefaults",	this.skipDefaults);
		this.skipErrors		= options.get("skipErrors",		this.skipErrors);
		this.skipNulls		= options.get("skipNulls",		this.skipNulls);

		if (typeof this.indent == "number")
			this.indent = " ".repeat(this.indent);
		else
			this.indent = this.indent.toString();

		if (this.skipDefaults)
			this.defaultObjs = {}

		// "usings" is legacy, prefer "using" instead
		if (options.containsKey("usings"))
			this.usings = options.get("usings");

		if (options.containsKey("using")) {
			var using = options.get("using");
			if (sys.ObjUtil.is(using, sys.List.type$))
				this.usings = using;
			else if (using != null && sys.Str.trimToNull(using) != null)
				this.usings = sys.Str.split(using);
		}

		if (this.usings == null)
			this.usings = sys.List.make(sys.Str.type$, []);
	}



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
}
