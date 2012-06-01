/**
 * @file
 * org-info.js
 *
 * Version: 0.1.7.1
 *
 * @author Sebastian Rose, Hannover, Germany - sebastian_rose at gmx dot de
 *
 *
 * This software is subject to the GNU General Public Licens version 3:
 * see: http://www.gnu.org/licenses/
 *
 * Requirements:
 *
 *   Org-mode >= 6.12a
 *
 *   Org-mode > 6.23 (commit a68eb4b1e64cbe6e495fdd2c1eaf8ae597bf8602):
 *     You'll need at least org-info.js v.0.1.0.1
 *
 * Usage:
 *
 * Include this scipt into the Header of your HTML-exported org files by
 * customizing the variable org-export-html-style (TODO: add file local export
 * Options here).
 * You will also need this here somewhere in the HTML-page:
 *
 * <script type="text/javascript" language="JavaScript" src="org-info.js"></script>
 * <script type="text/javascript" language="JavaScript">
 *  <![CDATA[ // comment around this one
 *  org_html_manager.set("LOCAL_TOC", "1");
 *  org_html_manager.set("VIEW", "info");
 *  org_html_manager.set("VIEW_BUTTONS", "true");
 *  org_html_manager.set("LINK_UP", "http://full/path/to/index/of/this/directory.html");
 *  org_html_manager.set("LINK_HOME", "http://full/path/to/homepage.html");
 *  org_html_manager.set("MOUSE_HINT", "underline"); // or a color like '#eeeeee'
 *  org_html_manager.setup ();
 *  ]]> // comment around this one
 * </script>
 *
 *
 * The script is now roughly devided in sections by form-feeds. Editors can
 * move section wise using the common emacs commands for this purpos ('C-x ]'
 * and  'C-x ]').
 *
 * The sections are:
 *    1. This comment block.
 *    2. Everything around =OrgNodes=.
 *    3. =org_html_manager= constructor and setup.
 *    4. =org_html_manager= folding and view related stuff.
 *    5. =org_html_manager= history related methods.
 *    6. =org_html_manager= minibuffer handling.
 *    7. =org_html_manager= user input.
 *    8. =org_html_manager= search functonality.
 *    9. =org_html_manager= misc.
 *    10. Global functions.
 */





/**
 * Creates a new OrgNode.
 * An OrgOutline stores some refs to its assoziated node in the document tree
 * along with some additional properties.
 */
function OrgNode ( _div, _heading, _link, _depth, _parent, _base_id, _toc_anchor)
{
  var t = this;
  t.DIV = _div;
  t.BASE_ID = _base_id;                // The suffix that's common to the heading and the diffs.
  t.IDX = -1;                          // The index in OrgHtmlManager::SECS[]
  t.HEADING = _heading;
  t.L = _link;
  t.HAS_HIGHLIGHT = false;             // Node highlighted (search)
  t.PARENT = _parent;
  t.DIRTY = false;                     // Node is dirty, when children get
                                       // folded seperatly.
  t.STATE = OrgNode.STATE_FOLDED;
  t.TOC   = _toc_anchor;
  t.DEPTH = _depth;                    // The Rootelement will have
                                       // the depth 0. All other
                                       // Nodes get the depth from
                                       // their h-level (h1, h2...)
  t.FOLDER = null;
  t.CHILDREN = new Array();
  t.NAV = "";                          // The info navigation
  t.BUTTONS = null;

  if(null != t.PARENT) {
    t.PARENT.addChild(this);
    t.hide();
  }

  var folder = document.getElementById("text-"+t.BASE_ID);
  if(null == folder && _base_id) {
    var fid =  _base_id.substring(4);
    folder = document.getElementById("text-"+fid); // try old schema
  }
  if(null != folder)
    t.FOLDER = folder;

  t.isTargetFor = new Object();
  t.isTargetFor['#' + t.BASE_ID] = 2;
  OrgNode.findTargetsIn(t.isTargetFor, t.HEADING, 1); // 1 == prefere this one as section link.
  OrgNode.findTargetsIn(t.isTargetFor, t.FOLDER, 3);
}

// static variables
OrgNode.STATE_FOLDED = 0;
OrgNode.STATE_HEADLINES = 1;
OrgNode.STATE_UNFOLDED = 2;



//
// static functions
//

OrgNode.findTargetsIn = function(safe, container, priority)
{
  if(container) {
    var a = container.getElementsByTagName("a");
    if(a) {
      for(var i=0;i<a.length;++i) {
        var n =  a[i].getAttribute('id');
        if(n) safe['#' + n] = priority;
        else {
          n = a[i].getAttribute('name');
          if(n) safe['#' + n] = priority;
        }}}}};

OrgNode.hideElement = function (e)
{
  if(e && e['style']) { // test for e['style'] is just quick fix for error elsewhere (fixed toc and title)
    e.style.display = 'none';
    e.style.visibility = 'hidden';
  }
};

OrgNode.showElement = function (e)
{
  if(e && e['style']) {
    e.style.display = 'block';
    e.style.visibility = 'visible';
  }
};

OrgNode.unhideElement = function (e)
{
  e.style.display="";
  e.style.visibility="";
};

OrgNode.isHidden = function(e)
{
  if(e.style.display=='none' || e.style.visibility=='hidden')
    return true;
  return false;
};

OrgNode.toggleElement = function (e)
{
  if(e.style.display == 'none') {
    e.style.display = 'block';
    e.style.visibility = 'visible';
  } else {
    e.style.display = 'none';
    e.style.visibility = 'hidden';
  }
};

/**
 * Find the OrgNode containing a DOM-text-node.
 * @param dom The text node.
 * @param org The OrgNode containing the OrgNode in question.
 */
OrgNode.textNodeToIdx = function (dom, org)
{
  while(dom.nodeType !=  1 /* IE has no Node.ELEMENT_NODE... */
        || -1 == dom.attributes["id"].value.indexOf("outline-container-")) {
    dom = dom.parentNode;
  }
  var base_id = dom.attributes["id"].value.substr(18);
  return OrgNode.idxForBaseId(base_id, org);
};

/**
 * Find an OrgNode with base_id inside an OrgNode and return it's idx.
 * @param base The base_id.
 * @param org The OrgNode.
 */
OrgNode.idxForBaseId = function(base, org)
{
  if(org.BASE_ID == base) return org;
  for(var i = 0; i < org.CHILDREN.length; ++i) {
    var o = OrgNode.idxForBaseId(idx, org.CHILDREN[i]);
    if(null != o) return o;
  }
  return null;
};

//
// member functions
//

OrgNode.prototype.addChild = function (child)
{
  this.CHILDREN.push(child);
  return this.PARENT;
};


//
// OrgNode methods for paging (info mode)
//

OrgNode.prototype.hide = function ()
{
    OrgNode.hideElement(this.DIV);
    if(this.PARENT)
      this.PARENT.hide();
};

OrgNode.prototype.show = function ()
{
  OrgNode.showElement(this.DIV);
  if(this.DEPTH > 2)
    this.PARENT.show();
};

OrgNode.prototype.showAllChildren = function ()
{
  for(var i=0;i<this.CHILDREN.length;++i) { this.CHILDREN[i].showAllChildren(); }
  this.show();
};

OrgNode.prototype.hideAllChildren = function ()
{
  for(var i=0;i<this.CHILDREN.length;++i) { this.CHILDREN[i].hideAllChildren(); }
  this.hide();
};

/**
 * Set class for links to current page to current and visited pages to visited_after_load
 * Note: visited pages will be reset after reload!
 */
OrgNode.prototype.setLinkClass = function (on)
{
  if(this.TOC) {
    if(on) this.TOC.className = "current";
    else this.TOC.className = "visited_after_load";
  }
}

//
//  OrgNode methods for folding
//

/**
 * This one is called onclick() to toggle the folding state of the node.
 * This one sets its parent dirty, since node is folded individually. Hence the
 * next folding of parent has to collapse all.
 * @param show_childrens_folders Boolean. This is only used for the special way
 * of toggling of the ROOT element. If true, prevents this OrgNode from showing
 * the folder.
 */
OrgNode.prototype.fold = function (hide_folder)
{
  if(this.PARENT)
    this.PARENT.DIRTY = true;
  if(this.DIRTY) {
    this.DIRTY = false;
    this.STATE = OrgNode.STATE_UNFOLDED; // so next state is FOLDED. See below.
  }

  if(null != this.FOLDER) {

    if(this.STATE == OrgNode.STATE_FOLDED) {
      // I was folded but one could click on me. So now show Headlines
      // recursive.
      if(this.CHILDREN.length) {
        this.STATE = OrgNode.STATE_HEADLINES;
        OrgNode.hideElement(this.FOLDER);
        for(var i=0;i<this.CHILDREN.length;++i) { this.CHILDREN[i].setState(OrgNode.STATE_HEADLINES); }
      } else if (! hide_folder) {
        // without children jump to unfolded state:
        this.STATE = OrgNode.STATE_UNFOLDED;
        OrgNode.showElement(this.FOLDER);
      }
    }
    else if(this.STATE == OrgNode.STATE_HEADLINES) {
      // show all content recursive
      this.STATE = OrgNode.STATE_UNFOLDED;
      OrgNode.showElement(this.FOLDER);
      for(var i=0;i<this.CHILDREN.length;++i) { this.CHILDREN[i].setState(OrgNode.STATE_UNFOLDED); }
    }
    else {
      // collapse. Show only own headline
      this.STATE = OrgNode.STATE_FOLDED;
      OrgNode.hideElement(this.FOLDER);
      for(var i=0;i<this.CHILDREN.length;++i) { this.CHILDREN[i].setState(OrgNode.STATE_FOLDED); }
    }
  }
};

/**
 * Recursive state switching. This functions folds children of activated
 * parents. The states have a slightly different meaning here. Here the
 * surrounding div (outline-container-id) gets hidden too.
 * Maybe add OrgNode.STATE_HIDDEN with same value?
 */
OrgNode.prototype.setState = function (state)
{
  var t = this;
  for(var i=0;i<t.CHILDREN.length;++i) {
    t.CHILDREN[i].setState(state);
  }
  switch (state)
    {
      case OrgNode.STATE_FOLDED:
        OrgNode.hideElement(t.FOLDER);
        OrgNode.hideElement(t.DIV);
      break;
      case OrgNode.STATE_HEADLINES:
        OrgNode.hideElement(t.FOLDER);
        OrgNode.showElement(t.DIV);
      break;
      default:
        OrgNode.showElement(t.FOLDER);
        OrgNode.showElement(t.DIV);
    }
  t.STATE = state;
};





/**
 * OrgManager manages OrgNodes.
 * We don't create anything in the constructor, since the document is not loaded
 * yet.
 */
var org_html_manager = {
  // Option
  MOUSE_HINT: 0,               // Highlight heading under mouse?
  BODY:null,                   // The container all the contents live in.
  PLAIN_VIEW: 0,               // We're in plain view mode. On startup:= overview
  CONTENT_VIEW: 1,             // plain view show structure
  ALL_VIEW: 2,                 // plain view show all
  INFO_VIEW: 3,                // We're in info view mode
  SLIDE_VIEW: 4,               // Slidemode.
  VIEW: this.CONTENT_VIEW,     // Default view mode (s. setup())
  LOCAL_TOC: false,            // Create sub indexes (s. setup()): "0", "1" "above", "below" (==1, default)
  LINK_HOME: 0,                // Link to this.LINK_HOME?
  LINK_UP: 0,                  // Link to this.LINK_UP?
  LINKS: "",                   // Prepare the links for later use (see setup),
  RUN_MAX: 1200,               // Max attempts to scan (results in ~2 minutes)
  RUN_INTERVAL: 100,           // Interval of scans in milliseconds.
  HIDE_TOC: false,             // Hide the table of contents.
  TOC_DEPTH: 0,                // Level to cut the table of contents. No cutting if 0.
  STARTUP_MESSAGE: 0,          // Show info at startup?
  POSTAMBLE: null,             // cache the 'postamble' element.
  // Private
  BASE_URL: document.URL,      // URL without '#sec-x.y.z'
  Q_PARAM: "",                 // A query param like `?VIEW=content'
  ROOT: null,                  // Root element or our OrgNode tree
  NODE: null,                  // The current node
  TITLE: null,                 // Save the title for hide/show
  INNER_TITLE: false,           // The cloned title in sec-1.
  LOAD_CHECK: null,            // Saves the setTimeout()'s value
  WINDOW: null,                // A div to display info view mode
  SECS: new Array(),           // The OrgNode tree
  REGEX: /(#)(.*$)/,           // identify a section link in toc
  SID_REGEX: /(^#)(sec-\d+([._]\d+)*$)/, // identify a plain section ID
  UNTAG_REGEX: /<[^>]+>/i,     // Remove HTML tags
  ORGTAG_REGEX: /^(.*)<span\s+class=[\'\"]tag[\'\"]>(<span[^>]+>[^<]+<\/span>)+<\/span>/i, // Remove Org tags
  TRIMMER: /^(\s*)([^\s].*)(\s*)$/, // Trim
  // FNREF_REGEX: /(fnr\.*)/,     // Footnote ref FIXME: not in use!?!
  TOC: null,                   // toc.
  RUNS: 0,                     // Count the scan runs.
  HISTORY: new Array(50),      // Save navigation history.
  HIST_INDEX: 0,
  SKIP_HISTORY: false,         // popHistory() set's this to true.
  FIXED_TOC: false,            // Leave toc alone if position=[fixed|absolute]?
  // Commands:
  CONSOLE: null,               // The div containing the minibuffer.
  CONSOLE_INPUT: null,
  CONSOLE_LABEL: null,
  CONSOLE_OFFSET: "50px",
  OCCUR: "",                   // The search string.
  SEARCH_REGEX: "",
  SEARCH_HL_REGEX: new RegExp('(<span class="org-info-js_search-highlight">)([^<]*?)(<\/span>)', "gi"),
  MESSAGING: 0,                // Is there a message in the console?
  MESSAGING_INPLACE: 1,
  MESSAGING_TOP: 2,
  // show help:
  HELPING: false,
  // console in read mode?
  READING: false,
  // if yes, which command caused the readmode?
  READ_COMMAND: "",
  // numerical commands are internal commands.
  READ_COMMAND_NULL: "_0",
  READ_COMMAND_HTML_LINK: "_1",
  READ_COMMAND_ORG_LINK: "_2",
  READ_COMMAND_PLAIN_URL_LINK: "_03",
  LAST_VIEW_MODE:0,
  TAB_INDEX: 1000,             // Users could have defined tabindexes!
  SEARCH_HIGHLIGHT_ON: false,
  TAGS: {},                    // Tags: {tag:[index,index2...],tag2:[index1,index2...]}
  SORTED_TAGS: new Array(),    // Sorted tags
  TAGS_INDEX: null,            // Caches the tags-index screen
  CLICK_TIMEOUT: null,         // Mousehandling
  SECNUM_MAP: {},              // Map section numbers to OrgNodes
  TOC_LINK: null,              // Last link used in TOC
  HOOKS: { run_hooks: false,   // Hoooks. run_hooks is false until onReady() is run.
           onShowSection: [],
           onReady: [] },

  /**
   * Setup the OrgHtmlManager for scanning.
   * Here the timeout func gets set, that tells the wakes up org_html_mager
   * for the next attempt to scan the document.
   * All user setable config vars (the documented ones) are checked and adjusted
   * to a legal value.
   */
  setup: function ()
  {
    var t = this;
    if(window['orgInfoHooks']) {
      for(var i in orgInfoHooks) {
        t.HOOKS[i] = orgInfoHooks[i];
      }
      t.HOOKS['run_hooks'] = false;
    }

    if(location.search) { // enable overwriting of settings
      var sets = location.search.substring(1).split('&');
      for(var i = 0; i < sets.length; ++i) {
        var pos = sets[i].indexOf('=');
        if(-1 != pos) {
          var v = sets[i].substring(pos+1);
          var k = sets[i].substring(0, pos);
          switch(k) {
            // Explicitely allow overwrites.
            // Fall through:
          case 'TOC':
          case 'TOC_DEPTH':
          case 'MOUSE_HINT':
          case 'HELP':
          case 'VIEW':
          case 'HIDE_TOC':
          case 'LOCAL_TOC':
          case 'OCCUR':
            t.set(k, decodeURIComponent(v));
            break;
          default: break;
          }
        }
      }
    }
    t.VIEW  = t.VIEW ? t.VIEW : t.PLAIN_VIEW;
    t.VIEW_BUTTONS = (t.VIEW_BUTTONS && t.VIEW_BUTTONS != "0") ? true : false;
    t.STARTUP_MESSAGE = (t.STARTUP_MESSAGE && t.STARTUP_MESSAGE != "0") ? true : false;
    t.LOCAL_TOC = (t.LOCAL_TOC && t.LOCAL_TOC != "0") ? t.LOCAL_TOC : false;
    t.HIDE_TOC = (t.TOC && t.TOC != "0") ? false : true;
    t.INNER_TITLE = (t.INNER_TITLE && t.INNER_TITLE != "title_above") ? false : true;
    if(t.FIXED_TOC && t.FIXED_TOC != "0") {
      t.FIXED_TOC = true;
      t.HIDE_TOC = false;
    }
    else t.FIXED_TOC = false;

    t.LINKS +=
    ((t.LINK_UP && t.LINK_UP != document.URL) ? '<a href="'+t.LINK_UP+'">Up</a> / ' : "") +
    ((t.LINK_HOME && t.LINK_HOME != document.URL) ? '<a href="'+t.LINK_HOME+'">HOME</a> / ' : "") +
    '<a href="javascript:org_html_manager.showHelp();">HELP</a> / ';

    t.LOAD_CHECK = window.setTimeout("OrgHtmlManagerLoadCheck()", 50);
  },

  trim: function(s)
  {
    var r = this.TRIMMER.exec(s);
    return RegExp.$2;
  },

  removeTags: function (s)
  {
    if(s) {
      while(s.match(this.UNTAG_REGEX)) {
        s = s.substr(0, s.indexOf('<')) + s.substr(s.indexOf('>') + 1);
      }}
    return s;
  },

  /**
   * Remove tags from headline's inner HTML.
   * @param s The headline's inner HTML.
   * @return @c s with all tags stripped.
   */
  removeOrgTags: function (s)
  {
    if(s.match(this.ORGTAG_REGEX)) {
      var matches = this.ORGTAG_REGEX.exec(s);
      return matches[1];
    }
    return s;
  },

  init: function ()
  {
    var t = this;
    t.RUNS++;
    t.BODY = document.getElementById("content");
    if(null == t.BODY) {
      if(5 > t.RUNS) {
        t.LOAD_CHECK = window.setTimeout("OrgHtmlManagerLoadCheck()", t.RUN_INTERVAL);
        return;
      } else { // be backward compatible
        t.BODY = document.getElementsByTagName("body")[0];
      }}
    t.PREA = document.getElementById("preamble");
    t.POST = document.getElementById("postamble");
    if(null == t.PREA) {
	t.PREA = t.BODY;
    }
    if(null == t.POST) {
	t.POST = t.BODY;
    }
    if(! t.WINDOW) {
      t.WINDOW = document.createElement("div");
      t.WINDOW.style.marginBottom = "40px";
      t.WINDOW.id = "org-info-js-window";
    }
    var theIndex = document.getElementById('table-of-contents');

    if(! t.initFromTOC()) {
      if( t.RUNS < t.RUN_MAX ) {
        t.LOAD_CHECK = window.setTimeout("OrgHtmlManagerLoadCheck()", t.RUN_INTERVAL);
        return;
      }
      // CANCELED: warn if not scanned_all ??
    }

    var start_section = 0;
    var start_section_explicit = false;

    if("" != location.hash) {
      t.BASE_URL = t.BASE_URL.substring(0, t.BASE_URL.indexOf('#'));
      // Search for the start section:
      for(var i=0;i<t.SECS.length;++i) {
        if(t.SECS[i].isTargetFor[location.hash]) {
          start_section = i;
          start_section_explicit = 1;
          break;
        }
      }
    }
    if("" != location.search) {
      t.Q_PARAM =  t.BASE_URL.substring(t.BASE_URL.indexOf('?'));
      t.BASE_URL = t.BASE_URL.substring(0, t.BASE_URL.indexOf('?'));
    }

    t.convertLinks(); // adjust internal links. BASE_URL has to be stripped.

    var pa=document.getElementById('postamble');
    if(pa) t.POSTAMBLE=pa;
    // Temporary FIX for missing P element if skip:nil
    var b = t.BODY;
    var n = b.firstChild;
    if(3 == n.nodeType) { // IE has no ....
      var neu = n.cloneNode(true);
      var p = document.createElement("p");
      p.id = "text-before-first-headline";
      p.appendChild(neu);
      b.replaceChild(p, n);
    }
    // END OF temporary FIX.

    t.CONSOLE = document.createElement("div");
    t.CONSOLE.innerHTML = '<form action="" style="margin:0px;padding:0px;" onsubmit="org_html_manager.evalReadCommand(); return false;">'
      +'<table id="org-info-js_console" style="width:100%;margin:0px 0px 0px 0px;border-style:none;" cellpadding="0" cellspacing="0" summary="minibuffer">'
      +'<tbody><tr><td id="org-info-js_console-icon" style="padding:0px 0px 0px 0px;border-style:none;">&#160;</td><td style="width:100%;vertical-align:middle;padding:0px 0px 0px 0px;border-style:none;">'
      +'<table style="width:100%;margin:0px 0px 0px 0px;border-style:none;" cellpadding="0" cellspacing="2">'
      +'<tbody><tr><td id="org-info-js_console-label" style="white-space:nowrap;padding:0px 0px 0px 0px;border-style:none;"></td></tr>'
      +'<tr><td style="width:100%;vertical-align:middle;padding:0px 0px 0px 0px;border-style:none;">'
      +'<input type="text" id="org-info-js_console-input" onkeydown="org_html_manager.getKey();"'
      +' onclick="this.select();" maxlength="150" style="width:100%;padding:0px;margin:0px 0px 0px 0px;border-style:none;"'
      +' value=""/></td></tr></tbody></table></td><td style="padding:0px 0px 0px 0px;border-style:none;">&#160;</td></tr></tbody></table>'
      +'</form>';
    t.CONSOLE.style.position = 'relative';
    t.CONSOLE.style.marginTop =  "-" + t.CONSOLE_OFFSET;
    t.CONSOLE.style.top = "-" + t.CONSOLE_OFFSET;
    t.CONSOLE.style.left = '0px';
    t.CONSOLE.style.width = '100%';
    t.CONSOLE.style.height = '40px';
    t.CONSOLE.style.overflow = 'hidden';
    t.CONSOLE.style.verticalAlign = 'middle';
    t.CONSOLE.style.zIndex = '9';
    t.CONSOLE.style.border = "1px solid #cccccc";
    t.CONSOLE.id = 'org-info-js_console-container';

    t.BODY.insertBefore(t.CONSOLE, t.BODY.firstChild);
    t.MESSAGING = false;
    t.CONSOLE_LABEL = document.getElementById("org-info-js_console-label");
    t.CONSOLE_INPUT = document.getElementById("org-info-js_console-input");
    document.onkeypress=OrgHtmlManagerKeyEvent;

    if(t.VIEW == t.INFO_VIEW) {
      t.infoView(start_section);
      t.showSection(start_section);
      // For Opera 10 - want to see the title and buttons on (re-)load.
      window.setTimeout(function(){window.scrollTo(0, 0);}, 100);
    }
    else if(t.VIEW == t.SLIDE_VIEW) {
      t.slideView(start_section);
      t.showSection(start_section);
    }
    else {
      var v = t.VIEW; // will be changed in t.plainView()!
      t.plainView(start_section, 1);
      t.ROOT.DIRTY = true;
      t.ROOT_STATE = OrgNode.STATE_UNFOLDED;
      t.toggleGlobaly();
      if(v > t.PLAIN_VIEW)
        t.toggleGlobaly();
      if (v == t.ALL_VIEW)
        t.toggleGlobaly();
      if(start_section_explicit) // Unfold the requested section
        t.showSection(start_section);
    }

    if("" != t.OCCUR) {
      t.CONSOLE_INPUT.value = t.OCCUR;
      t.READ_COMMAND = 'o';
      t.evalReadCommand();
    }

    if(t.STARTUP_MESSAGE) {
      t.warn("This page uses org-info.js. Press '?' for more information.", true);
    }
    t.HOOKS.run_hooks = true;                    // Unblock all hooks.
    t.runHooks('onReady', this.NODE);
  },


  initFromTOC: function ()
  {
    var t = this;
    // scan the document for sections. We do it by scanning the toc,
    // so we do what is customized for orgmode (depth of sections in toc).
    if(t.RUNS == 1 || ! t.ROOT) {
      var toc = document.getElementById("table-of-contents");

      if(null != toc) {
        var heading = null;
        var i = 0;
        for(i;heading == null && i < 7;++i)
          heading = toc.getElementsByTagName("h"+i)[0];
        heading.onclick = function() {org_html_manager.fold(0);};
        heading.style.cursor = "pointer";
        if(t.MOUSE_HINT) {
          heading.onmouseover = function(){org_html_manager.highlightHeadline(0);};
          heading.onmouseout = function(){org_html_manager.unhighlightHeadline(0);};
        }

        if(t.FIXED_TOC) {
          heading.setAttribute('onclick', 'org_html_manager.toggleGlobaly();');
          t.ROOT = new OrgNode( null,
                                t.BODY.getElementsByTagName("h1")[0],
                                'javascript:org_html_manager.navigateTo(0);',
                                0,
                                null ); // the root node
          t.TOC = new OrgNode( toc,
                               heading,
                               'javascript:org_html_manager.navigateTo(0);',
                               i,
                               null ); // the root node
          t.NODE = t.ROOT;
        }
        else {
          t.ROOT = new OrgNode( null,
                                t.BODY.getElementsByTagName("h1")[0],
                                'javascript:org_html_manager.navigateTo(0);',
                                0,
                                null ); // the root node
          if(t.HIDE_TOC) {
            t.TOC = new OrgNode( toc,
                                 "",
                                 'javascript:org_html_manager.navigateTo(0);',
                                 i,
                                 null );
            t.NODE = t.ROOT;
            OrgNode.hideElement(toc);
          }
          else {
            t.TOC = new OrgNode( toc,
                                 heading,
                                 'javascript:org_html_manager.navigateTo(0);',
                                 i,
                                 t.ROOT ); // the root node
            t.TOC.IDX = 0;
            t.NODE = t.TOC;
            t.SECS.push(t.TOC);
          }
        }
        if(t.TOC) t.TOC.FOLDER = document.getElementById("text-table-of-contents");
      }
      else
        return false;
    }

    var theIndex = t.TOC.FOLDER.getElementsByTagName("ul")[0]; // toc

    // Could we scan the document all the way down?
    // Return false if not.
    if(! t.ulToOutlines(theIndex))
      return false;

    var fn = document.getElementById('footnotes');
    if(fn) {
      var fnheading = null;
      var c = fn.childNodes;
      for(var i=0;i<c.length;++i) {
        if("footnotes"== c[i].className) {
          fnheading=c[i];
          break;}}
      var sec = t.SECS.length;
      fnheading.onclick = function() {org_html_manager.fold("" + sec);};
      fnheading.style.cursor = "pointer";
      if(t.MOUSE_HINT) {
        fnheading.onmouseover = function() {org_html_manager.highlightHeadline("" + sec);};
        fnheading.onmouseout = function() {org_html_manager.unhighlightHeadline("" + sec);};
      }
      var link = 'javascript:org_html_manager.navigateTo(' + sec + ')';
      var fnsec= new OrgNode ( fn, fnheading, link, 1, t.ROOT, "footnotes");
      t.SECS.push(fnsec);
    }

    if(t.TOC_DEPTH) {
      t.cutToc(theIndex, 1);
    }

    // Move the title into the first visible section.
    // TODO: show title above everything if FIXED_TOC !!!
    t.TITLE = document.getElementsByClassName("title")[0];
    if(t.INNER_TITLE && !t.FIXED_TOC && t.VIEW != t.SLIDE_VIEW) {
      t.INNER_TITLE = t.TITLE.cloneNode(true);
      /* TODO: this is still based on wrong behaviour of browsers (same id for two elements)
       * But this here does not work:
       * t.INNER_TITLE.style = t.TITLE.style;
       * t.INNER_TITLE.id = "org-info-js-inner-title";
       */
      t.SECS[0].DIV.insertBefore(t.INNER_TITLE, t.SECS[0].DIV.firstChild);
      OrgNode.hideElement(t.TITLE);
    }

    // Create all the navigation links:
    t.build();
    t.NODE = t.SECS[0];

    t.BODY.insertBefore(t.WINDOW, t.NODE.DIV);

    return true;
  },

  /**
   * Used by OrgHtmlManager::initFromToc
   */
  ulToOutlines: function (ul)
  {
    if(ul.hasChildNodes() && ! ul.scanned_for_org) {
      for(var i=0; i<ul.childNodes.length; ++i) {
        if(false == this.liToOutlines(ul.childNodes[i])) {
          return false;
        }
      }
      ul.scanned_for_org = 1;
    }
    return true;
  },

  /**
   * Used by OrgHtmlManager::initFromToc
   */
  liToOutlines: function (li)
  {
    if(! li.scanned_for_org) {
      for(var i=0; i<li.childNodes.length; ++i) {
        var c = li.childNodes[i];
        switch (c.nodeName) {
        case "A":
          var newHref = this.mkNodeFromHref(c);
          if(false == newHref) {
            return false;
          }
          else {
            c.href = newHref;
            c.tabIndex = this.TAB_INDEX;
            c.onfocus=function(){org_html_manager.TOC_LINK=this;void 0;};
            if(null==this.TOC_LINK) this.TOC_LINK=c;
            this.TAB_INDEX++;
          }
          break;
        case "UL":
          return this.ulToOutlines(c);
          break;
        }
      }
      li.scanned_for_org = 1;
    }
    return true;
  },

  /**
   * Used by OrgHtmlManager::initFromToc
   */
  cutToc: function (ul, cur_depth)
  {
    cur_depth++;
    if(ul.hasChildNodes()) {
      for(var i=0; i < ul.childNodes.length; ++i) {
        var li = ul.childNodes[i];
        for(var j=0; j < li.childNodes.length; ++j) {
          var c = li.childNodes[j];
          if(c.nodeName == "UL") {
            if(cur_depth > this.TOC_DEPTH)
              li.removeChild(c);
            else
              this.cutToc(c, cur_depth); }}}}
  },

  /**
   * Used by OrgHtmlManager::liToOutlines
   * @param anchor <a...> element in the TOC, that links to a section.
   */
  mkNodeFromHref: function (anchor)
  {
    s = anchor.href;
    if(s.match(this.REGEX)) {
      var matches = this.REGEX.exec(s);
      var id = matches[2];
      var h = document.getElementById(id);
      // This heading could be null, if the document is not yet entirely loaded.
      // So we stop scanning and set the timeout func in caller.
      // We could even count the <ul> and <li> elements above to speed up the next
      // scan.
      if(null == h) {
        return(false);
      }
      var div = h.parentNode;
      var sec = this.SECS.length;
      var depth = div.className.substr(8);
      h.onclick = function() {org_html_manager.fold("" + sec);};
      h.style.cursor = "pointer";
      if(this.MOUSE_HINT) {
        h.onmouseover = function() {org_html_manager.highlightHeadline("" + sec);};
        h.onmouseout = function() {org_html_manager.unhighlightHeadline("" + sec);};
      }
      var link = 'javascript:org_html_manager.navigateTo(' + sec + ')';
      if(depth > this.NODE.DEPTH) {
        this.NODE = new OrgNode ( div, h, link, depth, this.NODE, id, anchor);
      }
      else if (depth == 2) {
        this.NODE = new OrgNode ( div, h, link, depth, this.ROOT, id, anchor);
      }
      else {
        var p = this.NODE;
        while(p.DEPTH > depth) p = p.PARENT;
        this.NODE = new OrgNode ( div, h, link, depth, p.PARENT, id, anchor);
      }
      this.SECS.push(this.NODE);
      // Prepare the tags-index:
      var spans = h.getElementsByTagName("span");
      if(spans) {
        for(var i = 0; i < spans.length; ++i) {
          if(spans[i].className == "tag") {
            var tags = spans[i].innerHTML.split("&nbsp;");
            for(var j = 0; j < tags.length; ++j) {
              var t = this.removeTags(tags[j]);
              if(! this.TAGS[t]) {
                this.TAGS[t] = new Array();
                this.SORTED_TAGS.push(t);
              }
              this.TAGS[t].push(sec);
            }
          }
          else if(spans[i].className.match(this.SECNUM_REGEX)) {
            this.SECNUM_MAP[this.trim(spans[i].innerHTML)] = this.NODE;
          }
        }
      }
      this.NODE.hide();
      return (link);
    }
    // return the link as it was, if no section link:
    return (s);
  },

  /**
   * Creates all the navigation links for this.SECS.
   * This is called from initFromStructure() and initFromToc() as well.
   *
   * @todo Apply style classes to the generated links.
   */
  build: function ()
  {
    var index_name =  this.TITLE.innerHTML;
    var min_subindex_sec = 0;

    for(var i = 0; i < this.SECS.length; ++i)
    {
      this.SECS[i].IDX = i;
      var html = '<table class="org-info-js_info-navigation" width="100%" border="0" style="border-bottom:1px solid black;">'
        +'<tr><td colspan="3" style="text-align:left;border-style:none;vertical-align:bottom;">'
        +'<span style="float:left;display:inline;text-align:left;">'
        +'Top: <a accesskey="t" href="javascript:org_html_manager.navigateTo(0);">'+index_name+'</a></span>'
        +'<span style="float:right;display:inline;text-align:right;font-size:70%;">'
        + this.LINKS
        +'<a accesskey="m" href="javascript:org_html_manager.toggleView('+i+');">toggle view</a></span>'
        +'</td></tr><tr><td style="text-align:left;border-style:none;vertical-align:bottom;width:22%">';

      if(i>0)
        html += '<a accesskey="p" href="'+this.SECS[i-1].L
        +'" title="Go to: '+this.removeTags(this.SECS[i-1].HEADING.innerHTML)+'">Previous</a> | ';
      else
        html += 'Previous | ';

      if(i < this.SECS.length - 1)
        html += '<a accesskey="n" href="'+this.SECS[i+1].L
        +'" title="Go to: '+this.removeTags(this.SECS[i+1].HEADING.innerHTML)+'">Next</a>';
      else
        html += 'Next';

      html += '</td><td style="text-align:center;vertical-align:bottom;border-style:none;width:56%;">';

      if(i>0 && this.SECS[i].PARENT.PARENT) // != this.ROOT)
        html += '<a href="'+this.SECS[i].PARENT.L
        +'" title="Go to: '+this.removeTags(this.SECS[i].PARENT.HEADING.innerHTML)+'">'
        +'<span style="font-variant:small-caps;font-style:italic;">'
        +this.SECS[i].PARENT.HEADING.innerHTML+'</span></a>';
      else
        html += '<span style="font-variant:small-caps;font-style:italic;">'+this.SECS[i].HEADING.innerHTML+'</span>';

      // Right:
      html += '</td><td style="text-align:right;vertical-align:bottom;border-style:none;width:22%">';
      html += (i + 1) +'</td></tr></table>';

      // buttons:
      this.SECS[i].BUTTONS = document.createElement("div");
      this.SECS[i].BUTTONS.innerHTML = '<div class="org-info-js_header-navigation" style="display:inline;float:right;text-align:right;font-size:70%;font-weight:normal;">'
        + this.LINKS
        + '<a accesskey="m" href="javascript:org_html_manager.toggleView('+i+');">toggle view</a></div>';
      if(this.SECS[i].FOLDER)
        // this.SECS[i].HEADING.appendChild(this.SECS[i].BUTTONS);
        this.SECS[i].DIV.insertBefore(this.SECS[i].BUTTONS, this.SECS[i].HEADING); //div.firstChild.nextSibling);
      else if(this.SECS[i].DIV.hasChildNodes()) {
        this.SECS[i].DIV.insertBefore(this.SECS[i].BUTTONS, this.SECS[i].DIV.firstChild);
      }
      if(!this.VIEW_BUTTONS) OrgNode.hideElement(this.SECS[i].BUTTONS);
      this.SECS[i].NAV = html;

      // subindex for sections containing subsections:
      if(0 < this.SECS[i].CHILDREN.length && this.LOCAL_TOC)
      {
        var navi2 = document.createElement("div");
        navi2.className="org-info-js_local-toc";
        html = 'Contents:<br /><ul>';
        for(var k=0; k < this.SECS[i].CHILDREN.length; ++k) {
          html += '<li><a href="'
            +this.SECS[i].CHILDREN[k].L+'">'
            +this.removeTags(this.removeOrgTags(this.SECS[i].CHILDREN[k].HEADING.innerHTML))+'</a></li>';
        }
        html += '</ul>';
        navi2.innerHTML = html;
        if("above" == this.LOCAL_TOC) {
          if(this.SECS[i].FOLDER)
            this.SECS[i].FOLDER.insertBefore(navi2, this.SECS[i].FOLDER.firstChild);
          else
            this.SECS[i].DIV.insertBefore(
              navi2, this.SECS[i].DIV.getElementsByTagName("h"+this.SECS[i].DEPTH)[0].nextSibling);
        } else {
          if(this.SECS[i].FOLDER)
            this.SECS[i].FOLDER.appendChild(navi2);
          else
            this.SECS[i].DIV.appendChild(navi2);
        }
      }
    }
    // Setup the Tags for sorted output:
    this.SORTED_TAGS.sort();
  },

  /**
   * Execute arbitrary JavaScript code. Used for configuration.
   */
  set: function (eval_key, eval_val)
  {
    if("VIEW" == eval_key) {
      var pos = eval_val.indexOf('_');
      if(-1 != pos) {
        this.INNER_TITLE=eval_val.substr(pos + 1); // might be info_title_above now.
        eval_val=eval_val.substr(0, pos);
      }
      var overview = this.PLAIN_VIEW;
      var content = this.CONTENT_VIEW;
      var showall = this.ALL_VIEW;
      var info = this.INFO_VIEW;
      var info_title_above = this.INFO_VIEW;
      var slide = this.SLIDE_VIEW;
      eval("this."+eval_key+"="+eval_val+";");
    }
    else if("HELP" == eval_key)
      eval("this.STARTUP_MESSAGE="+eval_val+";");
    else {
      if(eval_val)
        eval("this."+eval_key+"='"+eval_val+"';");
      else
        eval("this."+eval_key+"=0;");
    }
  },

  convertLinks: function ()
  {
    var i = (this.HIDE_TOC ? 0 : 1);
    var j;
    var foot_sec = this.SECS.length - 1;
    // for(i; i < this.SECS.length; ++i) {
    var links = document.getElementsByTagName("a"); // must be document!
    for(j=0; j<links.length; ++j) {
      var href = links[j].href.replace(this.BASE_URL, '');
      // could use quicksort like search here:
      for(var k = 0; k < this.SECS.length; ++k) {
        if(this.SECS[k].isTargetFor[href]) {
          links[j].href="javascript:org_html_manager.navigateTo("+k+")";
          break;
        }}}},




  /**
   * Show a certain section.
   *
   * NOTE: Replacing window.location might change the view mode, if the mode was
   * requested using an URL like "?VIEW=...&param=value" and the mode was
   * different from the one specified in the <head> section. The solution is, to
   * track the query parameter until the user changes the view mode for the
   * first time.
   *
   * You can avoid the URL-replacing by setting @c org_html_manager.NODE to the
   * same node you want to display before calling this function. This
   * <u>should</u> be the case on startup.
   *
   * @param sec   The section to show. This is the index
   *              in @c SECS.
   */
  showSection: function (sec)
  {
    var t = this;
    var section = parseInt(sec);
    var last_node = t.NODE;
    var hook = 'onShowSection';
    if(t.HIDE_TOC && t.NODE == t.TOC && !t.FIXED_TOC) {
      OrgNode.hideElement(t.TOC.DIV);
      if(t.PLAIN_VIEW == t.VIEW) {
        t.ROOT.showAllChildren();
        for(var i=0;i<t.ROOT.CHILDREN.length;++i) {
          t.ROOT.CHILDREN[i].STATE = OrgNode.STATE_UNFOLDED;
          t.ROOT.CHILDREN[i].fold();
        }
      }
    }
    if('?/toc/?' != sec && null != t.TOC_LINK) t.TOC_LINK.blur();
    if('?/toc/?' == sec || (!isNaN(section) && t.SECS[section])) {
      if('?/toc/?' == sec && t.HIDE_TOC)
        {
          hook = 'onShowToc';
          t.NODE = t.TOC;
          t.ROOT.hideAllChildren();
          if(t.INFO_VIEW == t.VIEW)
            t.WINDOW.innerHTML = t.NODE.DIV.innerHTML;
          else
            t.NODE.setState(OrgNode.STATE_UNFOLDED);
          window.scrollTo(0, 0);
        }
      else
        {
          t.NODE = t.SECS[section];
          if(t.SLIDE_VIEW == t.VIEW || t.INFO_VIEW == t.VIEW) {
            OrgNode.hideElement(t.NODE.BUTTONS);
            t.NODE.setState(OrgNode.STATE_UNFOLDED);
            for(var i=0;i<t.NODE.CHILDREN.length; ++i)
              t.NODE.CHILDREN[i].hide();
            if(t.SLIDE_VIEW == t.VIEW) t.WINDOW.innerHTML = t.NODE.DIV.innerHTML;
            else t.WINDOW.innerHTML = t.NODE.NAV + t.NODE.DIV.innerHTML;
            t.NODE.hide();
            // Hide the body, to avoid jumping page when replacing the
            // location. Unfortunatly we cannot do this with a fixed TOC,
            // because the fixed TOC will jump then, causing links towards the
            // bottom to disapear again.
            if(! t.FIXED_TOC) OrgNode.hideElement(document.body);
            if(last_node.IDX != t.NODE.IDX)
              if('?/toc/?' != sec) window.location.replace(t.BASE_URL + t.Q_PARAM + t.getDefaultTarget());
            if(! t.FIXED_TOC) OrgNode.showElement(document.body);
          }
          else {
            if(! t.VIEW_BUTTONS) OrgNode.hideElement(last_node.BUTTONS);
            OrgNode.showElement(t.NODE.BUTTONS);
            t.NODE.setState(OrgNode.UNFOLDED);
            t.NODE.show();
            if(last_node.IDX != t.NODE.IDX)
              window.location.replace(t.BASE_URL + t.Q_PARAM + t.getDefaultTarget());
            if(t.NODE.IDX == 0) window.scrollTo(0, 0);
            else t.NODE.DIV.scrollIntoView(true);
          }
        }
    }
    last_node.setLinkClass();
    t.NODE.setLinkClass(true);
    t.runHooks(hook, {'last': last_node, 'current': t.NODE});
  },

  plainView: function (sec, skip_show_section)
  {
    var t = this;
    document.onclick = null;
    document.ondblclick = null;
    t.VIEW = t.PLAIN_VIEW;
    OrgNode.hideElement(t.WINDOW);
    if(t.INNER_TITLE) OrgNode.hideElement(t.INNER_TITLE);
    OrgNode.showElement(t.TITLE);
    // For Opera and accesskeys we have to remove the navigation here to get it
    // working when toggeling back to info view again:
    if(t.WINDOW.firstChild) // might not be set after init
      t.WINDOW.removeChild(t.WINDOW.firstChild);
    t.ROOT.showAllChildren();
    for(var i=0;i<t.ROOT.CHILDREN.length;++i) {
      t.ROOT.CHILDREN[i].STATE = OrgNode.STATE_UNFOLDED;
      t.ROOT.CHILDREN[i].fold();
    }
    if(!skip_show_section)
      t.showSection(sec);
    if(t.POSTAMBLE) OrgNode.showElement(t.POSTAMBLE);
    if(t.NODE.IDX == 0) window.scrollTo(0, 0);
    else t.NODE.DIV.scrollIntoView(true);
  },

  infoView: function (sec, skip_show_section)
  {
    var t = this;
    document.onclick = null;
    document.ondblclick = null;
    t.VIEW = t.INFO_VIEW;
    t.unhighlightHeadline(t.NODE.IDX);
    if(t.INNER_TITLE && !t.FIXED_TOC) {
      OrgNode.showElement(t.INNER_TITLE);
      OrgNode.hideElement(t.TITLE);
    }
    OrgNode.showElement(t.WINDOW);
    t.ROOT.hideAllChildren();
    if(t.TOC && !t.FIXED_TOC) OrgNode.hideElement(t.TOC.DIV);
    if(t.POSTAMBLE) OrgNode.showElement(t.POSTAMBLE);
    if(!skip_show_section)
      t.showSection(sec);
    window.scrollTo(0, 0);
  },

  slideView: function (sec, skip_show_section)
  {
    var t = this;
    t.VIEW = t.SLIDE_VIEW;
    t.unhighlightHeadline(t.NODE.IDX);
    OrgNode.hideElement(t.TITLE);
    if(t.INNER_TITLE) OrgNode.hideElement(t.INNER_TITLE);
    if(t.TOC) OrgNode.hideElement(t.TOC.DIV);
    OrgNode.showElement(t.TITLE);
    OrgNode.showElement(t.WINDOW);
    t.ROOT.hideAllChildren();
    OrgNode.hideElement(t.TOC.DIV);
    if(t.POSTAMBLE) OrgNode.hideElement(t.POSTAMBLE);
    t.adjustSlide(sec);
    if(!skip_show_section) t.showSection(sec);
  },

  // hide/show List-items. show > 0: show next listitem, < 0 hide last listitem. null means new section.
  adjustSlide: function(sec, show)
  {
    var nextForward = true;
    var nextBack = true;
    var next = false;
    if(sec > this.NODE.IDX) next = true;
    if(null == show) next = true;

    if(next) {
      for(var n=this.SECS[sec].FOLDER.firstChild;null != n;n=n.nextSibling){
        if("UL" == n.nodeName){
          var lis=n.getElementsByTagName("li");
          for(var i=1;i<lis.length;++i) {
            var l = lis[i];
            OrgNode.hideElement(l); nextForward = false;
          }
        }
      }
    }
    else {
      var lists = this.WINDOW.getElementsByTagName("ul");
      for(var n=0; n < lists.length; ++n){
        var lis=lists[n].getElementsByTagName("li");
        for(var i=1;i<lis.length;++i) {
          var l = lis[i];
          if(show > 0){
            if(OrgNode.isHidden(l)) {
              OrgNode.unhideElement(l);
              if(i< (lis.length-1)) nextForward=false;
              if(0<i) nextBack=false;
              break;
            }
          }
          else { // show < 0
            if(!OrgNode.isHidden(l)) {
              if(1<i) {
                nextBack=false;
                OrgNode.hideElement(lis[i - 1]);
                break;
              }
            }
          }
        }
      }
    }

    if(nextForward)
      document.onclick = function(){org_html_manager.scheduleClick("org_html_manager.nextSection(org_html_manager.NODE.IDX + 1)");};
    else
      document.onclick = function(){org_html_manager.scheduleClick("org_html_manager.adjustSlide(org_html_manager.NODE.IDX, +1)");};
    if(nextBack)
      document.ondblclick = function(){org_html_manager.scheduleClick("org_html_manager.previousSection()");};
    else
      document.ondblclick = function(){org_html_manager.scheduleClick("org_html_manager.adjustSlide("+this.NODE.IDX+", -1)");};
  },

  /**
   * Toggle the view mode.
   * This also resets the <code>Q_PARAM</code> to an empty string.
   * @param sec The section index to show.
   */
  toggleView: function (sec)
  {
    var t = this;
    t.Q_PARAM="";
    t.removeWarning();
    if(t.VIEW == t.INFO_VIEW)
      t.plainView(sec);
    else
      t.infoView(sec);
  },

  fold: function (sec)
  {
    var t = this;
    t.removeWarning();
    var section = parseInt(sec);
    t.SECS[section].fold();
    if(! t.VIEW_BUTTONS) OrgNode.hideElement(t.NODE.BUTTONS);
    t.NODE = t.SECS[section];
    OrgNode.showElement(t.NODE.BUTTONS);
  },

  toggleGlobaly: function ()
  {
    var t = this;
    if(t.ROOT.DIRTY) {
      t.ROOT.STATE = OrgNode.STATE_UNFOLDED;
    }

    if(OrgNode.STATE_UNFOLDED == t.ROOT.STATE) {
      for(var i=0;i<t.ROOT.CHILDREN.length;++i) {
        // Pretend they are unfolded. They will toggle to FOLDED then:
        t.ROOT.CHILDREN[i].STATE = OrgNode.STATE_UNFOLDED;
        t.ROOT.CHILDREN[i].fold(true);
      }
      t.ROOT.STATE = OrgNode.STATE_UNFOLDED;
      t.ROOT.STATE = OrgNode.STATE_FOLDED;
    }
    else if(OrgNode.STATE_FOLDED == t.ROOT.STATE) {
      for(var i=0;i<t.ROOT.CHILDREN.length;++i)
        t.ROOT.CHILDREN[i].fold(true);
      t.ROOT.STATE = OrgNode.STATE_HEADLINES;
    }
    else {
      for(var i=0;i<t.ROOT.CHILDREN.length;++i)
        t.ROOT.CHILDREN[i].fold();
      t.ROOT.STATE = OrgNode.STATE_UNFOLDED;
    }

    // All this sets ROOT dirty again. So clean it:
    t.ROOT.DIRTY = false;
  },



  executeClick: function(func)
  {
    var t = this;
    if     (t.READING)   { t.endRead(); t.hideConsole(); }
    else if(t.MESSAGING) { t.removeWarning(); }
    eval(func);
    if(null != t.CLICK_TIMEOUT) t.CLICK_TIMEOUT = null;
  },

  scheduleClick: function(func, when)
  {
    if(null == when) when = 250;
    if(null == this.CLICK_TIMEOUT) {
      this.CLICK_TIMEOUT = window.setTimeout("org_html_manager.executeClick(" + func + ")", when);
    }
    else {
      window.clearTimeout(this.CLICK_TIMEOUT);
      this.CLICK_TIMEOUT = null;
    }
  },



  nextSection: function()
  {
    var T = this;
    var i = T.NODE.IDX + 1;
    if(i<T.SECS.length) T.navigateTo(i);
    else T.warn("Already last section.");
  },

  previousSection: function()
  {
    var t = this;
    var i = t.NODE.IDX;
    if(i>0) t.navigateTo(i-1);
    else t.warn("Already first section.");
  },


  /**
   * This one is just here, because we might want to push different than
   * navigational commands on the history in the future. Is this true?
   */
  navigateTo: function (sec)
  {
    var t = this;
    if     (t.READING)   { t.endRead(); t.hideConsole(); }
    else if(t.MESSAGING) { t.removeWarning(); }
    if(t.VIEW == t.SLIDE_VIEW) t.adjustSlide(sec);
    t.pushHistory(sec, t.NODE.IDX);
    t.showSection(sec);
  },


  /**
   *  All undoable navigation commands should push the oposit here
   */
  pushHistory: function (command, undo)
  {
    var t = this;
    if(! t.SKIP_HISTORY) {
      t.HISTORY[t.HIST_INDEX] = new Array(command, undo);
      t.HIST_INDEX = (t.HIST_INDEX + 1) % 50;
    }
    t.SKIP_HISTORY = false;
    t.CONSOLE_INPUT.value = "";
  },

 /**
  * only 'b' and 'B' trigger this one
  */
  popHistory: function (foreward)
  {
    var t = this;
    if(foreward) {
      if(t.HISTORY[t.HIST_INDEX]) {
        var s = parseInt(t.HISTORY[t.HIST_INDEX][0]);
        if(! isNaN(s) || '?/toc/?' == t.HISTORY[t.HIST_INDEX][0]) {
          t.showSection(t.HISTORY[t.HIST_INDEX][0]);
          t.CONSOLE_INPUT.value = "";
        }
        else {
          t.SKIP_HISTORY = true;
          t.CONSOLE_INPUT.value = t.HISTORY[t.HIST_INDEX][0];
          t.getKey();
        }
        t.HIST_INDEX = (t.HIST_INDEX + 1) % 50;
        t.HBO=0;
      }
      else if(t.HFO && history.length) history.forward();
      else {
        t.HFO=1;
        t.warn("History: No where to foreward go from here. Any key and `B' to move to next file in history.");
      }
    } else {
      if(t.HISTORY[t.HIST_INDEX - 1]) {
        t.HIST_INDEX = t.HIST_INDEX == 0 ? 49 : t.HIST_INDEX - 1;
        var s = parseInt(t.HISTORY[t.HIST_INDEX][1]);
        if(! isNaN(s) || '?/toc/?' == t.HISTORY[t.HIST_INDEX][1]) {
          t.showSection(t.HISTORY[t.HIST_INDEX][1]);
          t.CONSOLE_INPUT.value = "";
        }
        else {
          t.SKIP_HISTORY = true;
          t.CONSOLE_INPUT.value = t.HISTORY[t.HIST_INDEX][1];
          t.getKey();
        }
        t.HFO=0;
      }
      else if(t.HBO && history.length) history.back();
      else {
        t.HBO=1;
        t.warn("History: No where to back go from here. Any key and `b' to move to previous file in history.");
      }
    }
  },





  warn: function (what, harmless, value)
  {
    var t = this;
    if(null == value) value = "";
    t.CONSOLE_INPUT.value = value;
    if(! harmless) t.CONSOLE_LABEL.style.color = "red";
    t.CONSOLE_LABEL.innerHTML = "<span style='float:left;'>"+what +"</span>"+
    "<span style='float:right;color:#aaaaaa;font-weight:normal;'>(press any key to proceed)</span>";
    t.showConsole();
    // wait until keyup was processed:
    window.setTimeout(function(){org_html_manager.CONSOLE_INPUT.value=value;}, 50);
  },

  startRead: function (command, label, value, shortcuts)
  {
    var t = this;
    if(null == value) value = "";
    if(null == shortcuts) shortcuts = "";
    t.READ_COMMAND = command;
    t.READING = true;
    t.CONSOLE_LABEL.innerHTML = "<span style='float:left;'>"+label+"</span>"+
    "<span style='float:right;color:#aaaaaa;font-weight:normal;'>("+shortcuts+"RET to close)</span>";
    t.showConsole();
    document.onkeypress=null;
    t.CONSOLE_INPUT.focus();
    t.CONSOLE_INPUT.onblur = function() {org_html_manager.CONSOLE_INPUT.focus();};
    // wait until keyup was processed:
    window.setTimeout(function(){org_html_manager.CONSOLE_INPUT.value=value;}, 50);
  },

  endRead: function (command, label)
  {
    var t = this;
    t.READING = false;
    t.READ_COMMAND = "";
    t.CONSOLE_INPUT.onblur = null;
    t.CONSOLE_INPUT.blur();
    document.onkeypress=OrgHtmlManagerKeyEvent;
  },

  removeWarning: function()
  {
    var t = this;
    t.CONSOLE_LABEL.style.color = "#333333";
    t.hideConsole();
  },

  showConsole: function()
  {
    var t = this;
    if(!t.MESSAGING) {
      if(t.VIEW == t.PLAIN_VIEW) {
        // Maybe clone the CONSOLE?
        t.BODY.removeChild(t.BODY.firstChild);
        t.NODE.DIV.insertBefore(t.CONSOLE, t.NODE.DIV.firstChild);
        t.NODE.DIV.scrollIntoView(true);
        t.MESSAGING = t.MESSAGING_INPLACE;
      } else {
        t.MESSAGING = t.MESSAGING_TOP;
        window.scrollTo(0, 0);
      }
      t.CONSOLE.style.marginTop = '0px';
      t.CONSOLE.style.top = '0px';
    }
  },

  hideConsole: function()
  {
    var t = this;
    if(t.MESSAGING) {
      t.CONSOLE.style.marginTop = "-" + t.CONSOLE_OFFSET;
      t.CONSOLE.style.top = "-" + t.CONSOLE_OFFSET;
      t.CONSOLE_LABEL.innerHTML = "";
      t.CONSOLE_INPUT.value = "";
      if(t.MESSAGING_INPLACE == t.MESSAGING) {
        t.NODE.DIV.removeChild(t.NODE.DIV.firstChild);
        t.BODY.insertBefore(t.CONSOLE, t.BODY.firstChild);
        if(t.NODE.IDX != 0) t.NODE.DIV.scrollIntoView();
      }
      t.MESSAGING = false;
    }
  },





  /**
   * All commands that add something to the history should return.
   */
  getKey: function ()
  {
    var t = this;
    var s = t.CONSOLE_INPUT.value;
    // return, if s is empty:
    if(0 == s.length) {
      if(t.HELPING) { t.showHelp(); return; }
      if(t.MESSAGING && !t.READING) t.removeWarning();
        return;
    }

    // the easiest is to just drop everything and clean the console.
    // User has to retype again.
    if(t.MESSAGING && !t.READING) {
      t.removeWarning();
      return;
    }
    else if(t.HELPING) {
      t.showHelp();
      t.CONSOLE_INPUT.value = "";
      return;
    }
    else if(t.READING) {
      return;
    }

    t.CONSOLE_INPUT.value = "";
    t.CONSOLE_INPUT.blur();

    // Always remove TOC from history, if HIDE_TOC
    if(t.HIDE_TOC && t.TOC == t.NODE && "v" != s && "V" != s && "\t" != s) {
      s = "b";
    }
    else if("\t" == s) {
      return true;
    }
    else {
      s = t.trim(s);
    }

    // SINGLE KEY COMMANDS GO HERE //

    if (1 == s.length)    // one char wide commands
      {
        if ('b' == s) {
          t.popHistory();
        }
        else if ('B' == s) {
          t.popHistory(true);
        }
        else if ('c' == s) {
          t.removeSearchHighlight();
          if(t.VIEW == t.INFO_VIEW || t.VIEW == t.SLIDE_VIEW) {
            // redisplay in info view mode:
            t.showSection(t.NODE.IDX);
          }
        }
        else if ('i' == s) {
          if(! t.FIXED_TOC) {
            if (t.HIDE_TOC) t.navigateTo('?/toc/?');
            // No cloning here:
            else if(0 != t.NODE.IDX) t.navigateTo(0);
          }
          if(null != t.TOC_LINK) t.TOC_LINK.focus();
        }
        else if ('m' == s) {
          t.toggleView(t.NODE.IDX);
          return;
        }
        else if ('x' == s) {
          t.slideView(t.NODE.IDX);
        }
        else if ('n' == s) {
          if(t.NODE.STATE == OrgNode.STATE_FOLDED && t.VIEW == t.PLAIN_VIEW) {
            t.showSection(t.NODE.IDX);
          }
          else if(t.NODE.IDX < t.SECS.length - 1) {
            t.navigateTo(t.NODE.IDX + 1);
          } else {
            t.warn("Already last section.");
            return;                          // rely on what happends if messaging
          }
        }
        else if ('N' == s) {
          if(t.NODE.IDX < t.SECS.length - 1) {
            var d = t.NODE.DEPTH;
            var idx = t.NODE.IDX + 1;
            while(idx < t.SECS.length - 1 && t.SECS[idx].DEPTH >= d) {
              if(t.SECS[idx].DEPTH == d) {
                t.navigateTo(idx);
                return;
              }
              ++idx;
            }
          }
          t.warn("No next sibling.");
          return;                          // rely on what happends if messaging
        }
        else if ('p' == s) {
          if(t.NODE.IDX > 0) {
            t.navigateTo(t.NODE.IDX - 1);
          } else {
            t.warn("Already first section.");
            return;                          // rely on what happends if messaging
          }
        }
        else if ('P' == s) {
          if(t.NODE.IDX > 0) {
            var d = t.NODE.DEPTH;
            var idx = t.NODE.IDX - 1;
            while(idx >= 0 && t.SECS[idx].DEPTH >= d) {
              if(t.SECS[idx].DEPTH == d) {
                t.navigateTo(idx);
                return;
              }
              --idx;
            }
          }
          t.warn("No previous sibling.");
        }
        else if ('q' == s) {
          if(window.confirm("Really close this file?")) {
            window.close();
          }
        }
        else if ('<' == s || 't' == s) {
          if(0 != t.NODE.IDX) t.navigateTo(0);
          else window.scrollTo(0,0);
        }
        else if ('>' == s || 'E' == s || 'e' == s) {
          if((t.SECS.length - 1) != t.NODE.IDX) t.navigateTo(t.SECS.length - 1);
          else t.SECS[t.SECS.length - 1].DIV.scrollIntoView(true);
        }
        else if ('v' == s) {
          if(window.innerHeight)
            window.scrollBy(0, window.innerHeight - 30);
          else if(document.documentElement.clientHeight)
            window.scrollBy(0, document.documentElement.clientHeight - 30);
          else
            window.scrollBy(0, document.body.clientHeight - 30);
        }
        else if ('V' == s) {
          if(window.innerHeight)
            window.scrollBy(0, -(window.innerHeight - 30));
          else if(document.documentElement.clientHeight)
            window.scrollBy(0, -(document.documentElement.clientHeight - 30));
          else
            window.scrollBy(0, -(document.body.clientHeight - 30));
        }
        else if ('u' == s) {
          if(t.NODE.PARENT != t.ROOT) {
            t.NODE = t.NODE.PARENT;
            t.showSection(t.NODE.IDX);
          }
        }
        else if ('W' == s) {
          t.plainView(t.NODE.IDX);
          t.ROOT.DIRTY = true;
          t.ROOT_STATE = OrgNode.STATE_UNFOLDED;
          t.toggleGlobaly();
          t.toggleGlobaly();
          t.toggleGlobaly();
          window.print();
        }
        else if ('f' == s) {
          if(t.VIEW != t.INFO_VIEW) {
            t.NODE.fold();
            t.NODE.DIV.scrollIntoView(true);
          }
        }
        else if ('F' == s) {
          if(t.VIEW != t.INFO_VIEW) {
            t.toggleGlobaly();
            t.NODE.DIV.scrollIntoView(true);
          }
        }
        else if ('?' == s || '¿' == s) {
          t.showHelp();
        }
        else if ('C' == s) {
          if(t.SORTED_TAGS.length) t.showTagsIndex();
          else t.warn("No Tags found.");
        }
        else if ('H' == s && t.LINK_HOME) {
          window.document.location.href = t.LINK_HOME;
        }
        else if ('h' == s && t.LINK_UP) {
          window.document.location.href = t.LINK_UP;
        }

        /* === READ COMMANDS === */

        else if ('l' == s) {
          if("" != t.OCCUR) {
            t.startRead(t.READ_COMMAND_HTML_LINK, "Choose HTML-link type: 's' = section, 'o' = occur");
          } else {
            t.startRead(s, "HTML-link:",
                           '<a href="' + t.BASE_URL +  t.getDefaultTarget() + '">' +
                           document.title + ", Sec. '" + t.removeTags(t.NODE.HEADING.innerHTML) + "'</a>",
                           "C-c to copy, ");
            window.setTimeout(function(){org_html_manager.CONSOLE_INPUT.select();}, 100);
          }
          return;
        }
        else if ('L' == s) {
          if("" != t.OCCUR) {
            t.startRead(t.READ_COMMAND_ORG_LINK, "Choose Org-link type: 's' = section, 'o' = occur");
          } else {
            t.startRead(s, "Org-link:",
                           '[[' + t.BASE_URL + t.getDefaultTarget() + '][' +
                           document.title + ", Sec. '" + t.removeTags(t.NODE.HEADING.innerHTML) + "']]",
                           "C-c to copy, ");
            window.setTimeout(function(){org_html_manager.CONSOLE_INPUT.select();}, 100);
          }
          return;
        }
        else if ('U' == s) {
          if("" != t.OCCUR) {
            t.startRead(t.READ_COMMAND_PLAIN_URL_LINK, "Choose Org-link type: 's' = section, 'o' = occur");
          } else {
              t.startRead(s, "Plain URL Link:", t.BASE_URL + t.getDefaultTarget(),
                             "C-c to copy, ");
            window.setTimeout(function(){org_html_manager.CONSOLE_INPUT.select();}, 100);
          }
          return;
        }
        else if ('g' == s) {
          t.startRead(s, "Enter section number:");
          return;
        }
        else if ('o' == s) {
          if("" != t.OCCUR) t.startRead(s, "Occur:", t.OCCUR, "RET to use previous, DEL ");
          else t.startRead(s, "Occur:", t.OCCUR);
          window.setTimeout(function(){org_html_manager.CONSOLE_INPUT.value=org_html_manager.OCCUR;org_html_manager.CONSOLE_INPUT.select();}, 100);
          return;
        }
        else if ('s' == s) {
          if("" != t.OCCUR) t.startRead(s, "Search forward:", t.OCCUR, "RET to use previous, DEL ");
          else t.startRead(s, "Search forward:", t.OCCUR);
          window.setTimeout(function(){org_html_manager.CONSOLE_INPUT.value=org_html_manager.OCCUR;org_html_manager.CONSOLE_INPUT.select();}, 100);
          return;
        }
        else if ('S' == s) {
          if("" == t.OCCUR) {
            s = "s";
            t.startRead(s, "Search forward:");
          }
          else {
            t.READ_COMMAND = s;
            t.evalReadCommand();
          }
          return;
        }
        else if ('r' == s) {
          if("" != t.OCCUR) t.startRead(s, "Search backwards:", t.OCCUR, "RET to use previous, DEL ");
          else t.startRead(s, "Search backwards:", t.OCCUR);
          window.setTimeout(function(){org_html_manager.CONSOLE_INPUT.value=org_html_manager.OCCUR;org_html_manager.CONSOLE_INPUT.select();}, 100);
          return;
        }
        else if ('R' == s) {
          if("" == t.OCCUR) {
            s = "r";
            t.startRead(s, "Search backwards:");
          }
          else {
            t.READ_COMMAND = s;
            t.evalReadCommand();
          }
          return;
        }
      }

    return;
  },

  /**
   * Please return, if you want the minibuffer to stay on screen.
   * Remember to call this.endRead()!
   */
  evalReadCommand: function()
  {
    var t = this;
    var command = t.READ_COMMAND;
    var result  = t.trim(t.CONSOLE_INPUT.value);

    t.endRead();

    if("" == command || "" == result) {
      t.hideConsole();
      return;
    }

    // VALID INPUT? COMMANDS FOLLOW HERE

    if(command == 'g') { // goto section
      var sec = t.SECNUM_MAP[result];
      if(null != sec) {
        t.hideConsole();
        t.navigateTo(sec.IDX);
        return;
      }
      t.warn("Goto section: no such section.", false, result);
      return;
    }

    else if(command == 's') { // search
      if("" == result) return false;
      if(t.SEARCH_HIGHLIGHT_ON) t.removeSearchHighlight();
      var restore = t.OCCUR;
      var plus = 0;
      if(result == t.OCCUR) plus++;
      t.OCCUR = result;
      t.makeSearchRegexp();
      for(var i = t.NODE.IDX + plus; i < t.SECS.length; ++i) {
        if(t.searchTextInOrgNode(i)) {
          t.OCCUR = result;
          t.hideConsole();
          t.navigateTo(t.SECS[i].IDX);
          return;
        }
      }
      t.warn("Search forwards: text not found.", false, t.OCCUR);
      t.OCCUR = restore;
      return;
    }

    else if(command == 'S') { // repeat search
      for(var i = t.NODE.IDX + 1; i < t.SECS.length; ++i) {
        if(t.searchTextInOrgNode(i)) {
          t.hideConsole();
          t.navigateTo(t.SECS[i].IDX);
          return;
        }
      }
      t.warn("Search forwards: text not found.", false, t.OCCUR);
      return;
    }

    else if(command == 'r') { // search backwards
      if("" == result) return false;
      if(t.SEARCH_HIGHLIGHT_ON) t.removeSearchHighlight();
      var restore = t.OCCUR;
      t.OCCUR = result;
      var plus = 0;
      if(result == t.OCCUR) plus++;
      t.makeSearchRegexp();
      for(var i = t.NODE.IDX - plus; i > -1; --i) {
        if(t.searchTextInOrgNode(i)) {
          t.hideConsole();
          t.navigateTo(t.SECS[i].IDX);
          return;
        }
      }
      t.warn("Search backwards: text not found.", false, t.OCCUR);
      t.OCCUR = restore;
      return;
    }

    else if(command == 'R') { // repeat search backwards
      for(var i = t.NODE.IDX - 1; i > -1; --i) {
        result = t.removeTags(t.SECS[i].HEADING.innerHTML);
        if(t.searchTextInOrgNode(i)) {
          t.hideConsole();
          t.navigateTo(t.SECS[i].IDX);
          return;
        }
      }
      t.warn("Search backwards: text not found.", false, t.OCCUR);
      return;
    }

    else if(command == 'o') { // occur
      if("" == result) return false;
      if(t.SEARCH_HIGHLIGHT_ON) t.removeSearchHighlight();
      var restore = t.OCCUR;
      t.OCCUR = result;
      t.makeSearchRegexp();
      var occurs = new Array();
      for(var i = 0; i < t.SECS.length; ++i) {
        if(t.searchTextInOrgNode(i)) {
          occurs.push(i);
        }
      }
      if(0 == occurs.length) {
        t.warn("Occur: text not found.", false, t.OCCUR);
        t.OCCUR = restore;
        return;
      }

      t.hideConsole();
      if(t.PLAIN_VIEW != t.VIEW) t.plainView();
      t.ROOT.DIRTY = true;
      t.toggleGlobaly();
      for(var i = 0; i < t.SECS.length; ++i) {
        OrgNode.showElement(t.SECS[i].DIV);
        OrgNode.hideElement(t.SECS[i].FOLDER);
      }
      for(var i = (occurs.length - 1); i >= 1; --i) {
        OrgNode.showElement(t.SECS[occurs[i]].FOLDER);
      }
      t.showSection(occurs[0]);
    }

    else if(command == t.READ_COMMAND_ORG_LINK) {
      var c = result.charAt(0);
      if('s' == c) {
        t.startRead(t.READ_COMMAND_NULL, "Org-link to this section:",
                       '[[' + t.BASE_URL + t.getDefaultTarget() + '][' +
                       document.title + ", Sec. '" +  t.removeTags(t.NODE.HEADING.innerHTML) + "']]",
                       "C-c to copy, ");
        window.setTimeout(function(){org_html_manager.CONSOLE_INPUT.select();}, 100);
      } else if('o' == c) {
        t.startRead(t.READ_COMMAND_NULL, "Org-link, occurences of <i>&quot;"+t.OCCUR+"&quot;</i>:",
                       '[[' + t.BASE_URL + "?OCCUR=" + t.OCCUR + '][' +
                       document.title + ", occurences of '" + t.OCCUR + "']]",
                       "C-c to copy, ");
        window.setTimeout(function(){org_html_manager.CONSOLE_INPUT.select();}, 100);
      } else {
        t.warn(c + ": No such link type!");
      }
    }

    else if(command == t.READ_COMMAND_HTML_LINK) {
      var c = result.charAt(0);
      if('s' == c) {
        t.startRead(t.READ_COMMAND_NULL, "HTML-link to this section:",
                       '<a href="' + t.BASE_URL + t.getDefaultTarget() + '">' +
                       document.title + ", Sec. '" +  t.removeTags(t.NODE.HEADING.innerHTML) + "'</a>",
                       "C-c to copy, ");
        window.setTimeout(function(){org_html_manager.CONSOLE_INPUT.select();}, 100);
      } else if('o' == c) {
        t.startRead(t.READ_COMMAND_NULL, "HTML-link, occurences of <i>&quot;"+t.OCCUR+"&quot;</i>:",
                       '<a href="' + t.BASE_URL + "?OCCUR=" + t.OCCUR + '">' +
                       document.title + ", occurences of '" + t.OCCUR + "'</a>",
                       "C-c to copy, ");
        window.setTimeout(function(){org_html_manager.CONSOLE_INPUT.select();}, 100);
      } else {
        t.warn(c + ": No such link type!");
      }
    }

    else if(command == t.READ_COMMAND_PLAIN_URL_LINK) {
      var c = result.charAt(0);
      if('s' == c) {
        t.startRead(t.READ_COMMAND_NULL, "Plain-link to this section:",
                       t.BASE_URL + t.getDefaultTarget(),
                       "C-c to copy, ");
        window.setTimeout(function(){org_html_manager.CONSOLE_INPUT.select();}, 100);
      } else if('o' == c) {
        t.startRead(t.READ_COMMAND_NULL, "Plain-link, occurences of <i>&quot;"+t.OCCUR+"&quot;</i>:",
                       t.BASE_URL + "?OCCUR=" + t.OCCUR,
                       "C-c to copy, ");
        window.setTimeout(function(){org_html_manager.CONSOLE_INPUT.select();}, 100);
      } else {
        t.warn(c + ": No such link type!");
      }
    }

  },

  getDefaultTarget: function(node)
  {
    if(null == node) node = this.NODE;
    var loc = "#" + this.NODE.BASE_ID;
    for(var s in node.isTargetFor) {
      if(! s.match(this.SID_REGEX)){loc = s; break;}
    }
    return loc;
  },





  makeSearchRegexp: function()
  {
    var tmp = this.OCCUR.replace(/>/g, "&gt;").
      replace(/</g, "&lt;").
      replace(/=/g, "\\=").
      replace(/\\/g, "\\\\").
      replace(/\?/g, "\\?").
      replace(/\)/g, "\\)").
      replace(/\(/g, "\\(").
      replace(/\./g, "[^<>]").
      replace(/\"/g, "&quot;");
    this.SEARCH_REGEX = new RegExp(">([^<]*)?("+tmp+")([^>]*)?<","ig");
  },

  searchTextInOrgNode: function(i)
  {
    var t = this;
    var ret = false;
    if(null != t.SECS[i]) {
      if(t.SEARCH_REGEX.test(t.SECS[i].HEADING.innerHTML)) {
        ret = true;
        t.setSearchHighlight(t.SECS[i].HEADING);
        t.SECS[i].HAS_HIGHLIGHT = true;
        t.SEARCH_HIGHLIGHT_ON = true;
      }
      if(t.SEARCH_REGEX.test(t.SECS[i].FOLDER.innerHTML)) {
        ret = true;
        t.setSearchHighlight(t.SECS[i].FOLDER);
        t.SECS[i].HAS_HIGHLIGHT = true;
        t.SEARCH_HIGHLIGHT_ON = true;
      }
      return ret;
    }
    return false;
  },

  setSearchHighlight: function(dom)
  {
    var tmp = dom.innerHTML;
    dom.innerHTML = tmp.replace(this.SEARCH_REGEX,
      '>$1<span class="org-info-js_search-highlight">$2</span>$3<');
  },

  removeSearchHighlight: function()
  {
    var t = this;
    for(var i = 0; i < t.SECS.length; ++i) {
      if(t.SECS[i].HAS_HIGHLIGHT) {
        while(t.SEARCH_HL_REGEX.test(t.SECS[i].HEADING.innerHTML)) {
          var tmp = t.SECS[i].HEADING.innerHTML;
          t.SECS[i].HEADING.innerHTML = tmp.replace(t.SEARCH_HL_REGEX, '$2');
        }
        while(t.SEARCH_HL_REGEX.test(t.SECS[i].FOLDER.innerHTML)) {
          var tmp = t.SECS[i].FOLDER.innerHTML;
          t.SECS[i].FOLDER.innerHTML = tmp.replace(t.SEARCH_HL_REGEX, '$2');
        }
        t.SECS[i].HAS_HIGHLIGHT = false;
      }
    }
    t.SEARCH_HIGHLIGHT_ON = false;
  },





  highlightHeadline: function(h)
  {
    var i = parseInt(h);
    if(this.PLAIN_VIEW == this.VIEW && this.MOUSE_HINT) {
      if('underline' == this.MOUSE_HINT)
        this.SECS[i].HEADING.style.borderBottom = "1px dashed #666666";
      else
        this.SECS[i].HEADING.style.backgroundColor = this.MOUSE_HINT;
    }
  },

  unhighlightHeadline: function(h)
  {
    var i = parseInt(h);
    if('underline' == this.MOUSE_HINT) {
      this.SECS[i].HEADING.style.borderBottom = "";
    }
    else
      this.SECS[i].HEADING.style.backgroundColor = "";
  },

  showHelp: function ()
  {
    var t = this;
    if     (t.READING)   { t.endRead(); }
    else if(t.MESSAGING) { t.removeWarning(); }
    /* This is an OrgMode version of the table. Turn on orgtbl-mode in
       this buffer, edit the table, then press C-c C-c with the cursor
       in the table.  The table will then be translated an inserted below.
#+ORGTBL: SEND Shortcuts orgtbl-to-generic :splice t :skip 2 :lstart "\t+'<tr>" :lend "</tr>'" :fmt (1 "<td><code><b>%s</b></code></td>" 2 "<td>%s</td>") :hline "\t+'</tbody><tbody>'"
      | Key          | Function                                                |
      |--------------+---------------------------------------------------------|
      | ? / &iquest; | show this help screen                                   |
      |--------------+---------------------------------------------------------|
      |              | <b>Moving around</b>                                    |
      | n / p        | goto the next / previous section                        |
      | N / P        | goto the next / previous sibling                        |
      | t / E        | goto the first / last section                           |
      | g            | goto section...                                         |
      | u            | go one level up (parent section)                        |
      | i / C        | show table of contents / tags index                     |
      | b / B        | go back to last / forward to next visited section.      |
      | h / H        | go to main index in this directory / link HOME page     |
      |--------------+---------------------------------------------------------|
      |              | <b>View</b>                                             |
      | m / x        | toggle the view mode between info and plain / slides    |
      | f / F        | fold current section / whole document (plain view only) |
      |--------------+---------------------------------------------------------|
      |              | <b>Searching</b>                                        |
      | s / r        | search forward / backward....                           |
      | S / R        | search again forward / backward                         |
      | o            | occur-mode                                              |
      | c            | clear search-highlight                                  |
      |--------------+---------------------------------------------------------|
      |              | <b>Misc</b>                                             |
      | l / L / U    | display HTML link / Org link / Plain-URL                |
      | v / V        | scroll down / up                                        |
      | W            | Print                                                   |
      */
    t.HELPING = t.HELPING ? 0 : 1;
    if (t.HELPING) {
      t.LAST_VIEW_MODE = t.VIEW;
      if(t.PLAIN_VIEW == t.VIEW) t.infoView(true);
      t.WINDOW.innerHTML = 'Press any key or <a href="javascript:org_html_manager.showHelp();">click here</a> to proceed.'
        +'<h2>Keyboard Shortcuts</h2>'
        +'<table cellpadding="3" rules="groups" frame="hsides" style="caption-side:bottom;margin:20px;border-style:none;" border="0";>'
        +'<caption><small>org-info.js, v.###VERSION###</small></caption>'
    +'<tbody>'
      // BEGIN RECEIVE ORGTBL Shortcuts
	+'<tr><td><code><b>? / &iquest;</b></code></td><td>show this help screen</td></tr>'
	+'</tbody><tbody>'
	+'<tr><td><code><b></b></code></td><td><b>Moving around</b></td></tr>'
	+'<tr><td><code><b>n / p</b></code></td><td>goto the next / previous section</td></tr>'
	+'<tr><td><code><b>N / P</b></code></td><td>goto the next / previous sibling</td></tr>'
	+'<tr><td><code><b>t / E</b></code></td><td>goto the first / last section</td></tr>'
	+'<tr><td><code><b>g</b></code></td><td>goto section...</td></tr>'
	+'<tr><td><code><b>u</b></code></td><td>go one level up (parent section)</td></tr>'
	+'<tr><td><code><b>i / C</b></code></td><td>show table of contents / tags index</td></tr>'
	+'<tr><td><code><b>b / B</b></code></td><td>go back to last / forward to next visited section.</td></tr>'
	+'<tr><td><code><b>h / H</b></code></td><td>go to main index in this directory / link HOME page</td></tr>'
	+'</tbody><tbody>'
	+'<tr><td><code><b></b></code></td><td><b>View</b></td></tr>'
	+'<tr><td><code><b>m / x</b></code></td><td>toggle the view mode between info and plain / slides</td></tr>'
	+'<tr><td><code><b>f / F</b></code></td><td>fold current section / whole document (plain view only)</td></tr>'
	+'</tbody><tbody>'
	+'<tr><td><code><b></b></code></td><td><b>Searching</b></td></tr>'
	+'<tr><td><code><b>s / r</b></code></td><td>search forward / backward....</td></tr>'
	+'<tr><td><code><b>S / R</b></code></td><td>search again forward / backward</td></tr>'
	+'<tr><td><code><b>o</b></code></td><td>occur-mode</td></tr>'
	+'<tr><td><code><b>c</b></code></td><td>clear search-highlight</td></tr>'
	+'</tbody><tbody>'
	+'<tr><td><code><b></b></code></td><td><b>Misc</b></td></tr>'
	+'<tr><td><code><b>l / L / U</b></code></td><td>display HTML link / Org link / Plain-URL</td></tr>'
	+'<tr><td><code><b>v / V</b></code></td><td>scroll down / up</td></tr>'
	+'<tr><td><code><b>W</b></code></td><td>Print</td></tr>'
      // END RECEIVE ORGTBL Shortcuts
       +'</tbody>'
       +'</table><br />Press any key or <a href="javascript:org_html_manager.showHelp();">click here</a> to proceed.';
      window.scrollTo(0, 0);
    }
    else {
      if(t.PLAIN_VIEW == t.LAST_VIEW_MODE) {
        t.plainView();
      }
      else if(t.SLIDE_VIEW == t.LAST_VIEW_MODE) {
        t.slideView();
      }
      t.showSection(t.NODE.IDX);
    }
  },


  showTagsIndex: function ()
  {
    var t = this;
    if     (t.READING)   { t.endRead(); }
    else if(t.MESSAGING) { t.removeWarning(); }
    t.HELPING = t.HELPING ? 0 : 1;
    if (t.HELPING) {
      t.LAST_VIEW_MODE = t.VIEW;
      if(t.PLAIN_VIEW == t.VIEW) t.infoView(true);
      if(null == t.TAGS_INDEX) {
        t.TAGS_INDEX = 'Press any key or <a href="javascript:org_html_manager.showTagsIndex();">click here</a> to proceed.'
          +'<br /><br />Click the headlines to expand the contents.'
          +'<h2>Index of Tags</h2>';
        for(var i = 0; i < t.SORTED_TAGS.length; ++i) {
          var tag = t.SORTED_TAGS[i];
          var fid = 'org-html-manager-sorted-tags-' + tag;
          t.TAGS_INDEX += '<a href="javascript:OrgNode.toggleElement(document.getElementById(\''
            + fid + '\'));"><h3>' + tag + '</h3></a>'
            + '<div id="' + fid + '" style="visibility:hidden;display:none;"><ul>';
          for(var j = 0; j < t.TAGS[tag].length; ++j) {
            var idx = t.TAGS[tag][j];
            t.TAGS_INDEX += '<li><a href="javascript:org_html_manager.showSection('
              + idx + ');">'
              + t.SECS[idx].HEADING.innerHTML +'</a></li>';
          }
          t.TAGS_INDEX += '</ul></div>';

        }
        t.TAGS_INDEX += '<br />Press any key or <a href="javascript:org_html_manager.showTagsIndex();">click here</a> to proceed.';
      }
      t.WINDOW.innerHTML = t.TAGS_INDEX;
      window.scrollTo(0, 0);
    }
    else {
      if(t.PLAIN_VIEW == t.LAST_VIEW_MODE) {
        t.plainView();
      }
      else if(t.SLIDE_VIEW == t.LAST_VIEW_MODE) {
        t.slideView();
      }
      t.showSection(t.NODE.IDX);
    }
  },


  /*
    HOOKs
  */

  /**
   * @private
   * Run hooks.
   * @param name Name of the hook to be executed.  One of the indicies in the
   *             <code>OrgHtmlManager.HOOKS</code> variable.
   * @param args The arguments to be passed to the hook function.
   *             E.g. <code>{an: "object"}</code> or <code>["array"]</code>.
   *             The first argument passed to the hook is the OrgHtmlManager
   *             itself.
   */
  runHooks: function(name, args)
  {
    if(this.HOOKS.run_hooks && this.HOOKS[name]) {
      for(var i=0; i<this.HOOKS[name].length; ++i) {
        this.HOOKS[name][i](this, args);
      }
    }
  },

  /**
   * Add Hooks.
   * If <code>this.HOOKS[name]</code> is not an array, it is created.
   * @param name Name of the hook, i.e. the index in <code>this.HOOKS</code>.
   * @param func The function object.
   */
  addHook: function(name, func)
  {
    if('run_hooks' != name) {
      this.HOOKS[name].push(func);
    }
  },

  /**
   * Remove Hooks.
   * @param name Name of the hook, i.e. the index in <code>this.HOOKS</code>.
   * @param func The function object to be removed from the hook.  JavaScript
   *             considers two functions written the same way identical.
   */
  removeHook: function(name, func)
  {
    if(this.HOOKS[name]) {
      for(var i = this.HOOKS[name].length - 1; i >= 0; --i) {
        if(this.HOOKS[name][i] == func) {
          this.HOOKS[name].splice(i, 1);
        }
      }
    }
  }

};







function OrgHtmlManagerKeyEvent (e)
{
  var c;
  if (!e) e = window.event;
  if (e.which) c = e.which;
  else if (e.keyCode) c = e.keyCode;

  if(e.ctrlKey) return;

  var s = String.fromCharCode(c);
  if(e.shiftKey)
    org_html_manager.CONSOLE_INPUT.value = org_html_manager.CONSOLE_INPUT.value + s;
  else
    org_html_manager.CONSOLE_INPUT.value = org_html_manager.CONSOLE_INPUT.value + s.toLowerCase();

  org_html_manager.getKey();
}


/**
 * Wait for document.body to be loaded and call org_html_manager.init().
 * In Opera document.body is true, even if not loaded (try with big big
 * file). This case is handled by the OrgHtmlManager class itself.
 */
function OrgHtmlManagerLoadCheck()
{
  org_html_manager.init();
}
