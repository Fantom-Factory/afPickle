
/**
 * Token defines the token type constants and provides
 * associated utility methods.
 */
function afPickle_Token() {}

//////////////////////////////////////////////////////////////////////////
// Token Type Ids
//////////////////////////////////////////////////////////////////////////

afPickle_Token.EOF              = -1;
afPickle_Token.ID               = 0;
afPickle_Token.BOOL_LITERAL     = 1;
afPickle_Token.STR_LITERAL      = 2;
afPickle_Token.INT_LITERAL      = 3;
afPickle_Token.FLOAT_LITERAL    = 4;
afPickle_Token.DECIMAL_LITERAL  = 5;
afPickle_Token.DURATION_LITERAL = 6;
afPickle_Token.URI_LITERAL      = 7;
afPickle_Token.NULL_LITERAL     = 8;
afPickle_Token.DOT              = 9;   //  .
afPickle_Token.SEMICOLON        = 10;  //  ;
afPickle_Token.COMMA            = 11;  //  ,
afPickle_Token.COLON            = 12;  //  :
afPickle_Token.DOUBLE_COLON     = 13;  //  ::
afPickle_Token.LBRACE           = 14;  //  {
afPickle_Token.RBRACE           = 15;  //  }
afPickle_Token.LPAREN           = 16;  //  (
afPickle_Token.RPAREN           = 17;  //  )
afPickle_Token.LBRACKET         = 18;  //  [
afPickle_Token.RBRACKET         = 19;  //  ]
afPickle_Token.LRBRACKET        = 20;  //  []
afPickle_Token.EQ               = 21;  //  =
afPickle_Token.POUND            = 22;  //  #
afPickle_Token.QUESTION         = 23;  //  ?
afPickle_Token.AS               = 24;  //  as
afPickle_Token.USING            = 25;  //  using

//////////////////////////////////////////////////////////////////////////
// Utils
//////////////////////////////////////////////////////////////////////////

afPickle_Token.isLiteral = function(type) {
	return afPickle_Token.BOOL_LITERAL <= type && type <= afPickle_Token.NULL_LITERAL;
}

afPickle_Token.toString = function(type) {
	switch (type) {
		case afPickle_Token.EOF:              return "end of file";
		case afPickle_Token.ID:               return "identifier";
		case afPickle_Token.BOOL_LITERAL:     return "Bool literal";
		case afPickle_Token.STR_LITERAL:      return "String literal";
		case afPickle_Token.INT_LITERAL:      return "Int literal";
		case afPickle_Token.FLOAT_LITERAL:    return "Float literal";
		case afPickle_Token.DECIMAL_LITERAL:  return "Decimal literal";
		case afPickle_Token.DURATION_LITERAL: return "Duration literal";
		case afPickle_Token.URI_LITERAL:      return "Uri literal";
		case afPickle_Token.NULL_LITERAL:     return "null";
		case afPickle_Token.DOT:              return ".";
		case afPickle_Token.SEMICOLON:        return ";";
		case afPickle_Token.COMMA:            return ",";
		case afPickle_Token.COLON:            return ":";
		case afPickle_Token.DOUBLE_COLON:     return "::";
		case afPickle_Token.LBRACE:           return "{";
		case afPickle_Token.RBRACE:           return "}";
		case afPickle_Token.LPAREN:           return "(";
		case afPickle_Token.RPAREN:           return ")";
		case afPickle_Token.LBRACKET:         return "[";
		case afPickle_Token.RBRACKET:         return "]";
		case afPickle_Token.LRBRACKET:        return "[]";
		case afPickle_Token.EQ:               return "=";
		case afPickle_Token.POUND:            return "#";
		case afPickle_Token.QUESTION:         return "?";
		case afPickle_Token.AS:               return "as";
		case afPickle_Token.USING:            return "using";
		default:                          return "Token[" + type + "]";
	}
}