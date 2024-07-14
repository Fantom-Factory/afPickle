
/**
 * Tokenizer inputs a stream of Unicode characters and
 * outputs tokens for the Fantom serialisation grammar.
 */
class Tokenizer {

	constructor(input) {
		this.input	= null;		// input stream
		this.type	= null;		// current Token type constant
		this.val	= null;		// String for id, Obj for literal
		this.line	= 1;		// current line number
		this.$undo	= null;		// if we've pushed back a token
		this.cur	= 0;		// current char
		this.curt	= 0;		// current charMap type
		this.peek	= 0;		// next char
		this.peekt	= 0;		// next charMap type

		if (input != null) {
			this.input = input;
			this.consume();
			this.consume();
		}
	}

	//////////////////////////////////////////////////////////////////////////
	// Access
	//////////////////////////////////////////////////////////////////////////

	/**
	 * Read the next token from the stream.  The token is
	 * available via the 'type' and 'val' fields.  The line
	 * of the current token is available in 'line' field.
	 * Return the 'type' field or -1 if at end of stream.
	 */
	next() {
		if (this.$undo != null) { this.$undo.reset(this); this.$undo = null; return this.type; }
		this.val = null;
		return this.type = this.doNext();
	}

	/**
	 * Read the next token, set the 'val' field but return
	 * type without worrying setting the 'type' field.
	 */
	doNext() {
		while (true) {
			// skip whitespace
			while (this.curt == Tokenizer.SPACE) this.consume();
			if (this.cur < 0) return Token.EOF;

			// alpha means identifier
			if (this.curt == Tokenizer.ALPHA) return this.id();

			// number
			if (this.curt == Tokenizer.DIGIT) return this.number(false);

			// symbol
			switch (this.cur) {
				case /* '+' */  43: this.consume(); return this.number(false);
				case /* '-' */  45: this.consume(); return this.number(true);
				case /* '"' */  34: return this.str();
				case /* '\''*/  39: return this.ch();
				case /* '`' */  96: return this.uri();
				case /* '(' */  40: this.consume(); return Token.LPAREN;
				case /* ')' */  41: this.consume(); return Token.RPAREN;
				case /* ',' */  44: this.consume(); return Token.COMMA;
				case /* ';' */  59: this.consume(); return Token.SEMICOLON;
				case /* '=' */  61: this.consume(); return Token.EQ;
				case /* '{' */ 123: this.consume(); return Token.LBRACE;
				case /* '}' */ 125: this.consume(); return Token.RBRACE;
				case /* '#' */  35: this.consume(); return Token.POUND;
				case /* '?' */  63: this.consume(); return Token.QUESTION;
				case /* '.' */  46:
					if (this.peekt == Tokenizer.DIGIT) return this.number(false);
					this.consume();
					return Token.DOT;
				case /* '[' */ 91:
					this.consume();
					if (this.cur == 93 /*']'*/) { this.consume(); return Token.LRBRACKET; }
					return Token.LBRACKET;
				case /* ']' */ 93:
					this.consume();
					return Token.RBRACKET;
				case /* ':' */ 58:
					this.consume();
					if (this.cur == 58 /*':'*/) { this.consume(); return Token.DOUBLE_COLON; }
					return Token.COLON;
				case /* '*' */ 42:
					if (this.peek == 42 /*'*'*/) { this.skipCommentSL(); continue; }
					break;
				case /* '/' */ 47:
					if (this.peek == 47 /*'/'*/) { this.skipCommentSL(); continue; }
					if (this.peek == 42 /*'*'*/) { this.skipCommentML(); continue; }
					break;
			}

			// invalid character
			throw this.err("Unexpected symbol: " + this.cur + " (0x" + this.cur.toString(16) + ")");
		}
	}

	//////////////////////////////////////////////////////////////////////////
	// Word
	//////////////////////////////////////////////////////////////////////////

	/**
	 * Parse an identifier: alpha (alpha|number)*
	 */
	id() {
		var val = "";
		var first = this.cur;
		while ((this.curt == Tokenizer.ALPHA || this.curt == Tokenizer.DIGIT) && this.cur > 0) {
			val += String.fromCharCode(this.cur);
			this.consume();
		}

		// TODO - whould this be faster to just compare the string directly?
		switch (first) {
			case /*'a'*/ 97:
				if (val == "as") { return Token.AS; }
				break;
			case /*'f'*/ 102:
				if (val == "false") { this.val = false; return Token.BOOL_LITERAL; }
				break;
			case /*'n'*/ 110:
				if (val == "null") { this.val = null; return Token.NULL_LITERAL; }
				break;
			case /*'t'*/ 116:
				if (val == "true") { this.val = true; return Token.BOOL_LITERAL; }
				break;
			case /*'u'*/ 117:
				if (val == "using") { return Token.USING; }
				break;
		}

		this.val = val;
		return Token.ID;
	}

	//////////////////////////////////////////////////////////////////////////
	// Number
	//////////////////////////////////////////////////////////////////////////

	/**
	 * parse a number literal token.
	 */
	number(neg) {
		// check for hex value
		if (this.cur == 48/*'0'*/ && this.peek == 120/*'x'*/)
			return this.hex();

		// read whole part
		var s = null;
		var whole = 0;
		var wholeCount = 0;
		while (this.curt == Tokenizer.DIGIT) {
			if (s != null) {
				s += String.fromCharCode(this.cur);
			}
			else {
				whole = whole*10 + (this.cur - 48);
				wholeCount++;
				if (wholeCount >= 18) { s = (neg) ? "-" : ""; s += whole; }
			}
			this.consume();
			if (this.cur == 95/*'_'*/) this.consume();
		}

		// fraction part
		var floating = false;
		if (this.cur == 46/*'.'*/ && this.peekt == Tokenizer.DIGIT) {
			floating = true;
			if (s == null) { s = (neg) ? "-" : ""; s += whole; }
			s += '.';
			this.consume();
			while (this.curt == Tokenizer.DIGIT) {
				s += String.fromCharCode(this.cur);
				this.consume();
				if (this.cur == 95/*'_'*/) this.consume();
			}
		}

		// exponent
		if (this.cur == 101/*'e'*/ || this.cur == 69/*'E'*/) {
			floating = true;
			if (s == null) { s = (neg) ? "-" : ""; s += whole; }
			s += 'e';
			this.consume();
			if (this.cur == 45/*'-'*/ || this.cur == 43/*'+'*/) { s += String.fromCharCode(this.cur); this.consume(); }
			if (this.curt != Tokenizer.DIGIT) throw this.err("Expected exponent digits");
			while (this.curt == Tokenizer.DIGIT) {
				s += String.fromCharCode(this.cur);
				this.consume();
				if (this.cur == 95/*'_'*/) this.consume();
			}
		}

		// check for suffixes
		var floatSuffix		= false;
		var decimalSuffix	= false;
		var dur = -1;
		if (/*'d'*/100 <= this.cur && this.cur <= 115/*'s'*/) {
			if (this.cur == 110/*'n'*/ && this.peek == 115/*'s'*/)	{ this.consume(); this.consume(); dur = 1; }
			if (this.cur == 109/*'m'*/ && this.peek == 115/*'s'*/)	{ this.consume(); this.consume(); dur = 1000000; }
			if (this.cur == 115/*'s'*/ && this.peek == 101/*'e'*/)	{ this.consume(); this.consume(); if (this.cur != 99/*'c'*/) throw this.err("Expected 'sec' in Duration literal"); this.consume(); dur = 1000000000; }
			if (this.cur == 109/*'m'*/ && this.peek == 105/*'i'*/)	{ this.consume(); this.consume(); if (this.cur != 110/*'n'*/) throw this.err("Expected 'min' in Duration literal"); this.consume(); dur = 60000000000; }
			if (this.cur == 104/*'h'*/ && this.peek == 114/*'r'*/)	{ this.consume(); this.consume(); dur = 3600000000000; }
			if (this.cur == 100/*'d'*/ && this.peek == 97/*'a'*/)	{ this.consume(); this.consume(); if (this.cur != 121/*'y'*/) throw this.err("Expected 'day' in Duration literal"); this.consume(); dur = 86400000000000; }
		}
		if (this.cur == 102/*'f'*/ || this.cur == 70/*'F'*/) {
			this.consume();
			floatSuffix = true;
		}
		else if (this.cur == 100/*'d'*/ || this.cur == 68/*'D'*/) {
			this.consume();
			decimalSuffix = true;
		}

		if (neg) whole = -whole;

		try {
			// float literal
			if (floatSuffix) {
				if (s == null)
					this.val = sys.Float.make(whole);
				else
					this.val = sys.Float.fromStr(s);
				return Token.FLOAT_LITERAL;
			}

			// decimal literal (or duration)
			if (decimalSuffix || floating) {
				var num = (s == null) ? whole : sys.Float.fromStr(s);
				if (dur > 0) {
					this.val = sys.Duration.make(num * dur);
					return Token.DURATION_LITERAL;
				}
				else {
					this.val = sys.Decimal.make(num);
					return Token.DECIMAL_LITERAL;
				}
			}

			// int literal (or duration)
			var num = (s == null) ? whole : Math.floor(Float.fromStr(s, true));
			if (dur > 0) {
				this.val = sys.Duration.make(num*dur);
				return Token.DURATION_LITERAL;
			}
			else {
				this.val = num;
				return Token.INT_LITERAL;
			}
		}
		catch (e) {
			throw this.err("Invalid numeric literal: " + s);
		}
	}

	/**
	 * Process hex int/long literal starting with 0x
	 */
	hex() {
		this.consume(); // 0
		this.consume(); // x

		// read first hex
		var type = Token.INT_LITERAL;
		var val = this.$hex(this.cur);
		if (val < 0) throw this.err("Expecting hex number");
		
		var str = String.fromCharCode(this.cur);
		this.consume();
		var nibCount = 1;
		while (true) {
			var nib = this.$hex(this.cur);
			if (nib < 0) {
				if (this.cur == 95/*'_'*/) { this.consume(); continue; }
				break;
			}
		str += String.fromCharCode(this.cur);
			nibCount++;
			if (nibCount > 16) throw this.err("Hex literal too big");
			this.consume();
		}
		this.val = sys.Int.fromStr(str, 16);
		return type;
	}

	$hex(c) {
		if (48 <= c && c <= 57)		return c - 48;
		if (97 <= c && c <= 102)	return c - 97 + 10;
		if (65 <= c && c <= 70)		return c - 65 + 10;
		return -1;
	}

	//////////////////////////////////////////////////////////////////////////
	// String
	//////////////////////////////////////////////////////////////////////////

	/**
	 * Parse a string literal Token.
	 */
	str() {
		this.consume();  // opening quote
		var s = "";
		var loop = true;
		while (loop) {
			switch (this.cur) {
				case 34/*'"'*/	: this.consume(); loop = false; break;
				case -1			: throw this.err("Unexpected end of string");
				case 36/*'$'*/	: throw this.err("Interpolated strings unsupported");
				case 92/*'\\'*/	: s += this.escape$(); break;
				case 13/*'\r'*/	: s += '\n'; this.consume(); break;
				default			: s += String.fromCharCode(this.cur); this.consume(); break;
			}
		}
		this.val = s;
		return Token.STR_LITERAL;
	}

	//////////////////////////////////////////////////////////////////////////
	// Character
	//////////////////////////////////////////////////////////////////////////

	/**
	 * Parse a char literal token (as Int literal).
	 */
	ch() {
		// consume opening quote
		this.consume();

		// if \ then process as escape
		var c;
		if (this.cur == 92/*'\\'*/) {
			c = this.escape$();
		}
		else {
			c = this.cur;
			this.consume();
		}

		// expecting ' quote
		if (this.cur != 39/*'\''*/) throw this.err("Expecting ' close of char literal");
		this.consume();

		this.val = c;
		return Token.INT_LITERAL;
	}

	/**
	 * Parse an escapse sequence which starts with a \
	 */
	escape$() {
		// consume slash
		if (this.cur != 92/*'\\'*/) throw this.err("Internal error");
		this.consume();

		// check basics
		switch (this.cur) {
			case /*'b'*/  98: this.consume(); return '\b';
			case /*'f'*/ 102: this.consume(); return '\f';
			case /*'n'*/ 110: this.consume(); return '\n';
			case /*'r'*/ 114: this.consume(); return '\r';
			case /*'t'*/ 116: this.consume(); return '\t';
			case /*'$'*/  36: this.consume(); return '$';
			case /*'"'*/  34: this.consume(); return '"';
			case /*'\''*/ 39: this.consume(); return '\'';
			case /*'`'*/  96: this.consume(); return '`';
			case /*'\\'*/ 92: this.consume(); return '\\';
		}

		// check for uxxxx
		if (this.cur == 117/*'u'*/) {
			this.consume();
			var n3 = this.$hex(this.cur); this.consume();
			var n2 = this.$hex(this.cur); this.consume();
			var n1 = this.$hex(this.cur); this.consume();
			var n0 = this.$hex(this.cur); this.consume();
			if (n3 < 0 || n2 < 0 || n1 < 0 || n0 < 0) throw this.err("Invalid hex value for \\uxxxx");
			return String.fromCharCode((n3 << 12) | (n2 << 8) | (n1 << 4) | n0);
		}

		throw this.err("Invalid escape sequence");
	}

	//////////////////////////////////////////////////////////////////////////
	// Uri
	//////////////////////////////////////////////////////////////////////////

	/**
	 * Parse a uri literal Token.
	 */
	uri() {
		// consume opening tick
		this.consume();

		// store starting position
		var s = "";

		// loop until we find end of string
		while (true) {
			if (this.cur < 0) throw this.err("Unexpected end of uri");
			if (this.cur == 92/*'\\'*/) {
				s += this.escape$();
			}
			else {
				if (this.cur == 96/*'`'*/) { this.consume(); break; }
				s += String.fromCharCode(this.cur);
				this.consume();
			}
		}

		this.val = sys.Uri.fromStr(s);
		return Token.URI_LITERAL;
	}

	//////////////////////////////////////////////////////////////////////////
	// Comments
	//////////////////////////////////////////////////////////////////////////

	/**
	 * Skip a single line // comment
	 */
	skipCommentSL() {
		this.consume(); // first slash
		this.consume(); // next slash
		while (true) {
			if (this.cur == 10/*'\n'*/ || this.cur == 13/*'\r'*/) { this.consume(); break; }
			if (this.cur < 0) break;
			this.consume();
		}
		return null;
	}

	/**
	 * Skip a multi line /* comment. Note unlike C/Java,
	 * slash/star comments can be nested.
	 */
	skipCommentML() {
		this.consume(); // first slash
		this.consume(); // next slash
		var depth = 1;
		while (true) {
			if (this.cur == 42/*'*'*/ && this.peek == 47/*'/'*/) { this.consume(); this.consume(); depth--; if (depth <= 0) break; }
			if (this.cur == 47/*'/'*/ && this.peek == 42/*'*'*/) { this.consume(); this.consume(); depth++; continue; }
			if (this.cur < 0) break;
			this.consume();
		}
		return null;
	}

	//////////////////////////////////////////////////////////////////////////
	// Utils
	//////////////////////////////////////////////////////////////////////////

	/**
	 * Return a IOErr for current location in source.
	 */
	err(msg) {
		return afPickle_ObjDecoder.err(msg, this.line);
	}

	////////////////////////////////////////////////////////////////
	// Read
	////////////////////////////////////////////////////////////////

	/**
	 * Consume the cur char and advance to next char in buffer:
	 *  - updates cur, curt, peek, and peekt fields
	 *  - updates the line and col count
	 *  - end of file, sets fields to 0
	 */
	consume() {
		// check for newline
		if (this.cur == 10/*'\n'*/ || this.cur == 13/*'\r'*/) this.line++;

		// get the next character from the
		// stream; normalize \r\n newlines
		var c = this.input.readChar();
		if (c == 10/*'\n'*/ && this.peek == 13/*'\r'*/) c = this.input.readChar();
		if (c == null) c = -1;

		// roll cur to peek, and peek to new char
		this.cur	= this.peek;
		this.curt	= this.peekt;
		this.peek	= c;
		this.peekt	= 0 < c && c < 128 ? Tokenizer.charMap[c] : Tokenizer.ALPHA;
	}

	//////////////////////////////////////////////////////////////////////////
	// Undo
	//////////////////////////////////////////////////////////////////////////

	/**
	 * Pushback a token which will be the next read.
	 */
	undo(type, val, line) {
		if (this.$undo != null) throw new Err.make("only one pushback supported");
		this.$undo = new Undo(type, val, line);
	}

	/**
	 * Reset the current token state.
	 */
	reset(type, val, line) {
		this.type	= type;
		this.val	= val;
		this.line	= line;
		return type;
	}

	//////////////////////////////////////////////////////////////////////////
	// Char Map
	//////////////////////////////////////////////////////////////////////////

	static	charMap		= [];
	static	SPACE		= 1;
	static	ALPHA		= 2;
	static	DIGIT		= 3;

	// space characters; note \r is error in symbol()
	static {
		Tokenizer.charMap[32 /*' '*/ ]	= Tokenizer.SPACE;
		Tokenizer.charMap[10 /*'\n'*/]	= Tokenizer.SPACE;
		Tokenizer.charMap[13 /*'\r'*/]	= Tokenizer.SPACE;
		Tokenizer.charMap[9  /*'\t'*/]	= Tokenizer.SPACE;

		// alpha characters
		for (var i=97/*'a'*/; i<=122/*'z'*/; ++i) Tokenizer.charMap[i] = Tokenizer.ALPHA;
		for (var i=65/*'A'*/; i<=90 /*'Z'*/; ++i) Tokenizer.charMap[i] = Tokenizer.ALPHA;
		Tokenizer.charMap[95 /*'_'*/] = Tokenizer.ALPHA;

		// digit characters
		for (var i=48/*'0'*/; i<=57/*'9'*/; ++i) Tokenizer.charMap[i] = Tokenizer.DIGIT;
	}
}

//////////////////////////////////////////////////////////////////////////
// Undo
//////////////////////////////////////////////////////////////////////////

class Undo {

	constructor(t, v, l) {
		this.type	= t;
		this.val	= v;
		this.line	= l;
	}
	
	reset(t) {
		t.reset(this.type, this.val, this.line);
	}
}
