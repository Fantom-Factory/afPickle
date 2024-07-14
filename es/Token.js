
/**
 * Token defines the token type constants and provides
 * associated utility methods.
 */
class Token {

//////////////////////////////////////////////////////////////////////////
// Token Type Ids
//////////////////////////////////////////////////////////////////////////

	static EOF				= -1;
	static ID				= 0;
	static BOOL_LITERAL		= 1;
	static STR_LITERAL		= 2;
	static INT_LITERAL		= 3;
	static FLOAT_LITERAL	= 4;
	static DECIMAL_LITERAL	= 5;
	static DURATION_LITERAL	= 6;
	static URI_LITERAL		= 7;
	static NULL_LITERAL		= 8;
	static DOT				= 9;	//  .
	static SEMICOLON		= 10;	//  ;
	static COMMA			= 11;	//  ,
	static COLON			= 12;	//  :
	static DOUBLE_COLON		= 13;	//  ::
	static LBRACE			= 14;	//  {
	static RBRACE			= 15;	//  }
	static LPAREN			= 16;	//  (
	static RPAREN			= 17;	//  )
	static LBRACKET			= 18;	//  [
	static RBRACKET			= 19;	//  ]
	static LRBRACKET		= 20;	//  []
	static EQ				= 21;	//  =
	static POUND			= 22;	//  #
	static QUESTION			= 23;	//  ?
	static AS				= 24;	//  as
	static USING			= 25;	//  using

//////////////////////////////////////////////////////////////////////////
// Utils
//////////////////////////////////////////////////////////////////////////

	static isLiteral(type) {
		return Token.BOOL_LITERAL <= type && type <= Token.NULL_LITERAL;
	}

	static toString(type) {
		switch (type) {
			case Token.EOF				: return "end of file";
			case Token.ID				: return "identifier";
			case Token.BOOL_LITERAL		: return "Bool literal";
			case Token.STR_LITERAL		: return "String literal";
			case Token.INT_LITERAL		: return "Int literal";
			case Token.FLOAT_LITERAL	: return "Float literal";
			case Token.DECIMAL_LITERAL	: return "Decimal literal";
			case Token.DURATION_LITERAL	: return "Duration literal";
			case Token.URI_LITERAL		: return "Uri literal";
			case Token.NULL_LITERAL		: return "null";
			case Token.DOT				: return ".";
			case Token.SEMICOLON		: return ";";
			case Token.COMMA			: return ",";
			case Token.COLON			: return ":";
			case Token.DOUBLE_COLON		: return "::";
			case Token.LBRACE			: return "{";
			case Token.RBRACE			: return "}";
			case Token.LPAREN			: return "(";
			case Token.RPAREN			: return ")";
			case Token.LBRACKET			: return "[";
			case Token.RBRACKET			: return "]";
			case Token.LRBRACKET		: return "[]";
			case Token.EQ				: return "=";
			case Token.POUND			: return "#";
			case Token.QUESTION			: return "?";
			case Token.AS				: return "as";
			case Token.USING			: return "using";
			default						: return "Token[" + type + "]";
		}
	}
}