
/**
 * ObjEncoder serializes an object to an output stream.
 */
function afPickle_ObjEncoder(out, options) {
	this.out			= out;
	this.level			= 0;
	this.indent			= "\t";
	this.skipDefaults	= false;
	this.skipErrors		= false;
	this.curFieldType	= null;
	this.defaultObjs	= null;
	this.usings			= fan.sys.List.make(fan.sys.Str.$type, ["sys"]);
	if (options != null) this.initOptions(options);

	if (this.usings.size() > 0) {
		var that = this;
		this.usings.each(fan.sys.Func.make(
			fan.sys.List.make(fan.sys.Param.$type, [
				new fan.sys.Param("val","sys::Str", false),
			]),
			fan.sys.Void.$type,
			function(val) {
				that.w("using ").w(val).w("\n");
			})
		);
		this.w("\n");
	}
}

//////////////////////////////////////////////////////////////////////////
// Static
//////////////////////////////////////////////////////////////////////////

afPickle_ObjEncoder.encode = function(obj) {
	var buf = fan.sys.StrBuf.make();
	var out = new fan.sys.StrBufOutStream(buf);
	new afPickle_ObjEncoder(out, null).writeObj(obj);
	return buf.toStr();
}

//////////////////////////////////////////////////////////////////////////
// Write
//////////////////////////////////////////////////////////////////////////

afPickle_ObjEncoder.prototype.writeObj = function(obj) {
	if (obj == null) {
		this.w("null");
		return;
	}

	var t = typeof obj;
	if (t === "boolean") { this.w(obj.toString()); return; }
	if (t === "number")	{ this.w(obj.toString()); return; }
	if (t === "string")	{ this.wStrLiteral(obj.toString(), '"'); return; }

	var f = obj.$fanType;
	if (f === fan.sys.Float.$type)	 { fan.sys.Float.encode(obj, this); return; }
	if (f === fan.sys.Decimal.$type) { fan.sys.Decimal.encode(obj, this); return; }

	if (obj.$literalEncode) {
		obj.$literalEncode(this);
		return;
	}
	var type = fan.sys.ObjUtil.$typeof(obj);
	var ser = type.facet(fan.sys.Serializable.$type, false);
	if (ser != null) {
		if (ser.m_simple)
			this.writeSimple(type, obj);
		else
			this.writeComplex(type, obj, ser);
	}
	else
	{
		if (this.skipErrors) // NOTE: /* not playing nice in str - escape as unicode char */
			this.w("null /\u002A Not serializable: ").w(type.qname()).w(" */");
		else
			throw fan.sys.IOErr.make("Not serializable: " + type);
	}
}

//////////////////////////////////////////////////////////////////////////
// Simple
//////////////////////////////////////////////////////////////////////////

afPickle_ObjEncoder.prototype.writeSimple = function(type, obj) {
	var str = fan.sys.ObjUtil.toStr(obj);
	this.wType(type).w('(').wStrLiteral(str, '"').w(')');
}

//////////////////////////////////////////////////////////////////////////
// Complex
//////////////////////////////////////////////////////////////////////////

afPickle_ObjEncoder.prototype.writeComplex = function(type, obj, ser) {
	this.wType(type);

	var first = true;
	var defObj = null;
	if (this.skipDefaults) {
		var defType = fan.sys.ObjUtil.$typeof(obj).toNonNullable();
		if (this.defaultObjs[defType] != undefined)
			// use cached defObj if it exists
			defObj = this.defaultObjs[defType];
		else
		{
			// else attempt to instantiate default object for type,
			// this will fail if complex has it-block ctor
			try { defObj = fan.sys.ObjUtil.$typeof(obj).make(); } catch(e) {}
			this.defaultObjs[defType] = defObj;
		}
	}

	var fields = type.fields();
	for (var i=0; i<fields.size(); ++i) {
		var f = fields.get(i);

		// skip static, transient, and synthetic (once) fields
		if (f.isStatic() || f.isSynthetic() || f.hasFacet(fan.sys.Transient.$type))
			continue;

		// get the value
		var val = f.get(obj);

		// if skipping defaults
		if (defObj != null) {
			var defVal = f.get(defObj);
			if (fan.sys.ObjUtil.equals(val, defVal)) continue;
		}

		// if first then open braces
		if (first) { this.w(' ').w('{').w('\n'); this.level++; first = false; }

		// field name =
		this.wIndent().w(f.$name()).w('=');

		// field value
		this.curFieldType = f.type().toNonNullable();
		this.writeObj(val);
		this.curFieldType = null;

		this.w('\n');
	}

	// if collection
	if (ser.m_collection)
		first = this.writeCollectionItems(type, obj, first);

	// if we output fields, then close braces
	if (!first) { this.level--; this.wIndent().w('}'); }
}

//////////////////////////////////////////////////////////////////////////
// Collection (@collection)
//////////////////////////////////////////////////////////////////////////

afPickle_ObjEncoder.prototype.writeCollectionItems = function(type, obj, first) {
	// lookup each method
	var m = type.method("each", false);
	if (m == null) throw fan.sys.IOErr.make("Missing " + type.qname() + ".each");

	// call each(it)
	var enc = this;
	var it	= fan.sys.Func.make(
		fan.sys.List.make(fan.sys.Param.$type),
		fan.sys.Void.$type,
		function(obj) {
			if (first) { enc.w('\n').wIndent().w('{').w('\n'); enc.level++; first = false; }
			enc.wIndent();
			enc.writeObj(obj);
			enc.w(',').w('\n');
			return null;
		});

	m.invoke(obj, fan.sys.List.make(fan.sys.Obj.$type, [it]));
	return first;
}

//////////////////////////////////////////////////////////////////////////
// List
//////////////////////////////////////////////////////////////////////////

afPickle_ObjEncoder.prototype.writeList = function(list) {
	// get of type
	var of = list.of();

	// decide if we're going output as single or multi-line format
	var nl = this.isMultiLine(of);

	// figure out if we can use an inferred type
	var inferred = false;
	if (this.curFieldType != null && (this.curFieldType instanceof fan.sys.ListType)) {
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

afPickle_ObjEncoder.prototype.writeMap = function(map) {
	// get k,v type
	var t = map.$typeof();

	// decide if we're going output as single or multi-line format
	var nl = this.isMultiLine(t.k) || this.isMultiLine(t.v);

	// figure out if we can use an inferred type
	var inferred = false;
	if (this.curFieldType != null && (this.curFieldType instanceof fan.sys.MapType)) {
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

afPickle_ObjEncoder.prototype.isMultiLine = function(t) {
	return t.pod() != fan.sys.Pod.$sysPod;
}

//////////////////////////////////////////////////////////////////////////
// Output
//////////////////////////////////////////////////////////////////////////

afPickle_ObjEncoder.prototype.wType = function(t) {
	return this.usings.contains(t.pod().m_name)
		? this.w(t.signature().split(t.pod().m_name + "::").join(""))
		: this.w(t.signature());
}

afPickle_ObjEncoder.prototype.wStrLiteral = function(s, quote) {
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
			case '"':	if (quote == '"') this.w('\\').w('"'); else this.w(c); break;
			case '`':	if (quote == '`') this.w('\\').w('`'); else this.w(c); break;
			case '$':	this.w('\\').w('$'); break;
			default:	 this.w(c);
		}
	}
	return this.w(quote);
}

afPickle_ObjEncoder.prototype.wIndent = function() {
	for (var i=0; i<this.level; ++i) this.w(this.indent);
	return this;
}

afPickle_ObjEncoder.prototype.w = function(s) {
	var len = s.length;
	for (var i=0; i<len; ++i)
		this.out.writeChar(s.charCodeAt(i));
	return this;
}

//////////////////////////////////////////////////////////////////////////
// Options
//////////////////////////////////////////////////////////////////////////

afPickle_ObjEncoder.prototype.initOptions = function(options) {
	this.indent			= options.get("indent",			this.indent);
	this.skipDefaults	= options.get("skipDefaults",	this.skipDefaults);
	this.skipErrors		= options.get("skipErrors",		this.skipErrors);

	if (typeof this.indent == "number")
		this.indent = " ".repeat(this.indent);
	else
		this.indent = this.indent.toString();

	if (this.skipDefaults)
		this.defaultObjs = {}

	if (options.containsKey("usings")) {
		this.usings = options.get("usings");
		if (this.usings == null)
			this.usings = fan.sys.List.make(fan.sys.Str.$type, []);
	}
}
