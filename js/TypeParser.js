
/**
 * TypeParser is used to parser formal type signatures which are
 * used in Sys.type() and in fcode for typeRefs.def.  Signatures
 * are formated as (with arbitrary nesting):
 *
 *   x::N
 *   x::V[]
 *   x::V[x::K]
 *   |x::A, ... -> x::R|
 */
function afPickle_TypeParser(sig, checked) {
	this.sig		= sig;						// signature being parsed
	this.len		= sig.length;				// length of sig
	this.pos		= 0;						// index of cur in sig
	this.cur		= sig.charAt(this.pos);		// cur character; sig[pos]
	this.peek		= sig.charAt(this.pos+1);	// next character; sig[pos+1]
	this.checked	= checked;					// pass thru checked flag
}

//////////////////////////////////////////////////////////////////////////
// Parse
//////////////////////////////////////////////////////////////////////////

afPickle_TypeParser.prototype.loadTop = function() {
	var type = this.load();
	if (this.cur != null) throw this.err();
	return type;
}

afPickle_TypeParser.prototype.load = function() {
	var type;

	// |...| is func
	if (this.cur == '|')
		type = this.loadFunc();

	// [ is either [ffi]xxx or [K:V] map
	else if (this.cur == '[') {
		var ffi = true;
		for (var i=this.pos+1; i<this.len; i++) {
			var ch = this.sig.charAt(i);
			if (this.isIdChar(ch)) continue;
			ffi = (ch == ']');
			break;
		}

		if (ffi)
			//type = loadFFI();
			throw fan.sys.ArgErr.make("Java types not allowed '" + this.sig + "'");
		else
			type = this.loadMap();
	}

	// otherwise must be basic[]
	else
		type = this.loadBasic();

	// nullable
	if (this.cur == '?') {
		this.consume('?');
		type = type.toNullable();
	}

	// anything left must be []
	while (this.cur == '[') {
		this.consume('[');
		this.consume(']');
		type = type.toListOf();
		if (this.cur == '?') {
			this.consume('?');
			type = type.toNullable();
		}
	}

	// nullable
	if (this.cur == '?') {
		this.consume('?');
		type = type.toNullable();
	}

	return type;
}

afPickle_TypeParser.prototype.loadMap = function() {
	this.consume('[');
	var key = this.load();
	this.consume(':');
	var val = this.load();
	this.consume(']');
	return new fan.sys.MapType(key, val);
}

afPickle_TypeParser.prototype.loadFunc = function() {
	this.consume('|');
	var params = [];
	if (this.cur != '-') {
		while (true) {
			params.push(this.load());
			if (this.cur == '-') break;
			this.consume(',');
		}
	}
	this.consume('-');
	this.consume('>');
	var ret = this.load();
	this.consume('|');

	return new fan.sys.FuncType(params, ret);
}

afPickle_TypeParser.prototype.loadBasic = function() {
	var podName = this.consumeId();
	this.consume(':');
	this.consume(':');
	var typeName = this.consumeId();

	// check for generic parameter like sys::V
	if (typeName.length == 1 && podName == "sys") {
		var type = fan.sys.Sys.genericParamType(typeName);
		if (type != null) return type;
	}

	return afPickle_TypeParser.find(podName, typeName, this.checked);
}

//////////////////////////////////////////////////////////////////////////
// Utils
//////////////////////////////////////////////////////////////////////////

afPickle_TypeParser.prototype.consumeId = function() {
	var start = this.pos;
	while (this.isIdChar(this.cur)) this.$consume();
	return this.sig.substring(start, this.pos);
}

afPickle_TypeParser.prototype.isIdChar = function(ch) {
	if (ch == null) return false;
	return fan.sys.Int.isAlphaNum(ch.charCodeAt(0)) || ch == '_';
}

afPickle_TypeParser.prototype.consume = function(expected) {
	if (this.cur != expected) throw this.err();
	this.$consume();
}

afPickle_TypeParser.prototype.$consume = function() {
	this.cur = this.peek;
	this.pos++;
	this.peek = this.pos+1 < this.len ? this.sig.charAt(this.pos+1) : null;
}

afPickle_TypeParser.prototype.err = function(sig) {
	if (sig === undefined) sig = this.sig;
	return fan.sys.ArgErr.make("Invalid type signature '" + sig + "'");
}

//////////////////////////////////////////////////////////////////////////
// Factory
//////////////////////////////////////////////////////////////////////////

/**
 * Parse the signature into a loaded type.
 */
afPickle_TypeParser.load = function(sig, checked) {
	// lookup in cache first
	var type = afPickle_TypeParser.cache[sig];
	if (type != null) return type;

	// if last character is ?, then parse a nullable
	var len = sig.length;
	var last = len > 1 ? sig.charAt(len-1) : 0;
	if (last == '?') {
		type = afPickle_TypeParser.load(sig.substring(0, len-1), checked).toNullable();
		afPickle_TypeParser.cache[sig] = type;
		return type;
	}

	// if the last character isn't ] or |, then this a non-generic
	// type and we don't even need to allocate a parser
	if (last != ']' && last != '|') {
		var podName;
		var typeName;
		try {
			var colon	= sig.indexOf("::");
			podName		= sig.substring(0, colon);
			typeName	= sig.substring(colon+2);
			if (podName.length == 0 || typeName.length == 0) throw fan.sys.Err.make("");
		}
		catch (err) {
			throw fan.sys.ArgErr.make("Invalid type signature '" + sig + "', use <pod>::<type>");
		}

		// if podName starts with [java] this is a direct Java type
		if (podName.charAt(0) == '[')
			throw fan.sys.ArgErr.make("Java types not allowed '" + sig + "'");

		// do a straight lookup
		type = afPickle_TypeParser.find(podName, typeName, checked);
		afPickle_TypeParser.cache[sig] = type;
		return type;
	}

	// we got our work cut out for us - create parser
	try {
		type = new afPickle_TypeParser(sig, checked).loadTop();
		afPickle_TypeParser.cache[sig] = type;
		return type;
	}
	catch (err) {
		throw fan.sys.Err.make(err);
	}
}

afPickle_TypeParser.find = function(podName, typeName, checked) {
	var pod = fan.sys.Pod.find(podName, checked);
	if (pod == null) return null;
	return pod.type(typeName, checked);
}

afPickle_TypeParser.cache = [];
