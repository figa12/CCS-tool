define("ace/theme/crisp",["require","exports","module","ace/lib/dom"], function(require, exports, module) {

exports.isDark = false;
exports.cssClass = "ace-crisp";
exports.cssText = ".ace-crisp .ace_gutter,\
.ace-crisp .ace_gutter {\
background: #FFFFFF;\
color: rgb(128,128,128)\
}\
.ace-crisp .ace_print-margin {\
width: 1px;\
background: #e8e8e8\
}\
.ace-crisp {\
background-color: #FFFFFF;\
color: #000000\
}\
.ace-crisp .ace_constant.ace_character,\
.ace-crisp .ace_constant.ace_other,\
.ace-crisp .ace_cursor,\
.ace-crisp .ace_variable.ace_language {\
font-weight: bold;\
color: #000000\
}\
.ace-crisp .ace_marker-layer .ace_selection {\
background: #BDD5FC\
}\
.ace-crisp.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px #FFFFFF;\
border-radius: 2px\
}\
.ace-crisp .ace_marker-layer .ace_step {\
background: rgb(198, 219, 174)\
}\
.ace-crisp .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid #BFBFBF\
}\
.ace-crisp .ace_marker-layer .ace_active-line {\
background: #FFFBD1\
}\
.ace-crisp .ace_gutter-active-line {\
background-color: #FFFBD1\
}\
.ace-crisp .ace_marker-layer .ace_selected-word {\
border: 1px solid #BDD5FC\
}\
.ace-crisp .ace_fold {\
background-color: #AF956F;\
border-color: #000000\
}\
.ace-crisp .ace_keyword,\
.ace-crisp .ace_support.ace_constant.ace_property-value {\
color: #AF956F\
}\
.ace-crisp .ace_keyword.ace_operator {\
color: #0000b6\
}\
.ace-crisp .ace_variable {\
font-weight: bold;\
color: #000000;\
}\
.ace-crisp .ace_keyword.ace_other.ace_unit {\
color: #96DC5F\
}\
.ace-crisp .ace_constant.ace_language {\
color: #39946A\
}\
.ace-crisp .ace_constant.ace_numeric {\
color: #46A609\
}\
.ace-crisp .ace_constant.ace_character.ace_entity {\
color: #BF78CC\
}\
.ace-crisp .ace_storage,\
.ace-crisp .ace_support.ace_function {\
color: #C52727\
}\
.ace-crisp .ace_invalid {\
background-color: #FF002A\
}\
.ace-crisp .ace_string {\
color: #5D90CD\
}\
.ace-crisp .ace_comment {\
color: #BCC8BA\
}\
.ace-crisp .ace_entity.ace_name.ace_tag,\
.ace-crisp .ace_entity.ace_other.ace_attribute-name {\
color: #606060\
}";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});