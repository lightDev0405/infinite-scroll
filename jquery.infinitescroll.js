

// Infinite Scroll jQuery plugin
// copyright Paul Irish
// version 1.2.090622

// project home  : http://www.infinite-scroll.com
// documentation : http://www.infinite-scroll.com/infinite-scroll-jquery-plugin/

// dual license  : GPL : http://creativecommons.org/licenses/GPL/2.0/
//               : MIT : http://creativecommons.org/licenses/MIT/


// todo: add preloading option.
 
;(function($){
    
  $.fn.infinitescroll = function(options,callback){
    
    // console log wrapper.
    function debug(){
      if (opts.debug)
        window.console && console.log.call(console,arguments)
    }
    
    // grab each selector option and see if any fail.
    function areSelectorsValid(opts){
      for (var key in opts){
        if (key.indexOf && key.indexOf('Selector') && $(opts[key]).length === 0){
            debug('Your ' + key + ' found no elements.');    
            return false;
        } 
        return true;
      }
    }


    // find the number to increment in the path.
    function determinePath(path){
      
      path.match(relurl) ? path.match(relurl)[2] : path; 

      // there is a 2 in the url surrounded by slashes, e.g. /page/2/
      if ( path.match(/^(.*?\/)2(\/|$)/) ){  
          path = path.match(/^(.*?\/)2(\/|$)/).slice(1);
      } else 
        // if there is any 2 in the url at all.
        if (path.match(/^(.*?)2(.*?$)/)){
          debug('Trying backup next selector parse technique. Treacherous waters here, matey.');
          path = path.match(/^(.*?)2(.*?$)/).slice(1);
      } else {
        debug('Sorry, we couldn\'t parse your Next (Previous Posts) URL. Verify your the css selector points to the correct A tag. If you still get this error: yell, scream, and kindly ask for help at infinite-scroll.com.');    
        props.isInvalidPage = true;  //prevent it from running on this page.
      }
      
      return path;
    }


    // 'document' means the full document usually, but sometimes the content of the overflow'd div in local mode
    function getDocumentHeight(){
      // weird doubletouch of scrollheight because http://soulpass.com/2006/07/24/ie-and-scrollheight/
      return opts.scrollElem ? ($(props.container)[0].scrollHeight && $(props.container)[0].scrollHeight) 
                                // needs to be document's height. (not props.container's) html's height is wrong in IE.
                                : $(document).height()
    }
    
    
        
    function isNearBottom(opts,props){
      
      // distance remaining in the scroll
      // computed as: document height - distance already scroll - viewport height - buffer
      var pixelsFromWindowBottomToBottom = getDocumentHeight()  -
                                            $(props.container).scrollTop() - 
                                            $(opts.scrollElem ? props.container : window).height();
      
      debug('math:',pixelsFromWindowBottomToBottom, props.pixelsFromNavToBottom);
      
      // if distance remaining in the scroll (including buffer) is less than the orignal nav to bottom....
      return (pixelsFromWindowBottomToBottom  - opts.bufferPx < props.pixelsFromNavToBottom);    
    }    
    
    function showDoneMsg(){
      props.loadingMsg
        .find('img').hide()
        .parent()
          .find('span').html(opts.donetext).animate({opacity: 1},2000).fadeOut('normal');
      
      // user provided callback when done    
      opts.errorCallback();
    }
    
    function infscrSetup(path,opts,props,callback){
    
        if (props.isDuringAjax || props.isInvalidPage || props.isDone) return; 
    
    		if ( !isNearBottom(opts,props) ) return; 
    		  
    		// we dont want to fire the ajax multiple times
    		props.isDuringAjax = true; 
    		
    		// show the loading message and hide the previous/next links
    		props.loadingMsg.appendTo( opts.contentSelector ).show();
    		$( opts.navSelector ).hide(); 
    		
    		// increment the URL bit. e.g. /page/3/
    		props.currPage++;
    		
    		debug('heading into ajax',path);
    		
    		// if we're dealing with a table we can't use DIVs
    		var box = $(opts.contentSelector).is('table') ? $('<tbody/>') : $('<div/>');  
    		
    		box
    		  .attr('id','infscr-page-'+props.currPage)
    		  .addClass('infscr-pages')
    		  .appendTo( opts.contentSelector )
    		  .load( path.join( props.currPage ) + ' ' + opts.itemSelector,null,function(){
    		    
    		        // if we've hit the last page...
    		        if (props.isDone){ 
                    showDoneMsg();
        			      return false;    
        			      
  	            } else {
  	              
  	                // if it didn't return anything
  	                if (box.children().length == 0){
  	                  // fake an ajaxError so we can quit.
  	                  $.event.trigger( "ajaxError", [{status:404}] ); 
  	                } 
  	                
  	                // fadeout currently makes the <em>'d text ugly in IE6
    		            props.loadingMsg.fadeOut('normal' ); 
  
    		            // smooth scroll to ease in the new content
    		            if (opts.animate){ 
      		            var scrollTo = $(window).scrollTop() + $('#infscr-loading').height() + opts.extraScrollPx + 'px';
                      $('html,body').animate({scrollTop: scrollTo}, 800,function(){ props.isDuringAjax = false; }); 
    		            }
                    
                    // pass in the new DOM element as context for the callback
                    callback.call( box[0] );
                    
    		            if (!opts.animate) props.isDuringAjax = false; // once the call is done, we can allow it again.
  	            }
    		    }); // end of load()
    			
    		    
      }  // end of infscrSetup()
          
  
    
      
    // lets get started.
    
    var opts    = $.extend({}, $.infinitescroll.defaults, options);
    var props   = $.infinitescroll; // shorthand
    callback    = callback || function(){};
    
    if (!areSelectorsValid(opts)){ return false;  }
    
     // we doing this on an overflow:auto div?
    props.container   =  opts.scrollElem ? this : document.documentElement;
    // contentSelector we'll use for our .load()
    opts.contentSelector = opts.contentSelector || this; 
    
    
    // get the relative URL - everything past the domain name.
    var relurl        = /(.*?\/\/).*?(\/.*)/;
    var path          = $(opts.nextSelector).attr('href');
    
    
    if (!path) { debug('Navigation selector not found'); return; }
    
    // set the path to be a relative URL from root.
    path          = determinePath(path);
    

    // reset scrollTop in case of page refresh:
    if (opts.scrollElem) $(props.container)[0].scrollTop = 0;

    // distance from nav links to bottom
    // computed as: height of the document + top offset of container - top offset of nav link
    props.pixelsFromNavToBottom =  getDocumentHeight()  +
                                     $(props.container).offset().top - 
                                     $(opts.navSelector).offset().top;
    
    // define loading msg
    props.loadingMsg = $('<div id="infscr-loading" style="text-align: center;"><img alt="Loading..." src="'+
                                  opts.loadingImg+'" /><div>'+opts.loadingText+'</div></div>');    
     // preload the image
    (new Image()).src    = opts.loadingImg;
  		      

  
    // set up our bindings
    $(document).ajaxError(function(e,xhr,opt){
      debug('Page not found. Self-destructing...');    
      
      // die if we're out of pages.
      if (xhr.status == 404){ 
        showDoneMsg();
        props.isDone = true; 
        $(opts.scrollElem ? this : window).unbind('scroll.infscr');
      } 
    });
    
    // bind scroll handler to element (if its a local scroll) or window  
    $(opts.scrollElem ? this : window)
      .bind('scroll.infscr', function(){ infscrSetup(path,opts,props,callback); } )
      .trigger('scroll.infscr'); // trigger the event, in case it's a short page
    
    
    return this;
  
  }  // end of $.fn.infinitescroll()
  

  
  // options and read-only properties object
  
  $.infinitescroll = {     
        defaults      : {
                          debug           : false,
                          preload         : false,
                          nextSelector    : "div.navigation a:first",
                          loadingImg      : "http://www.infinite-scroll.com/loading.gif",
                          loadingText     : "<em>Loading the next set of posts...</em>",
                          donetext        : "<em>Congratulations, you've reached the end of the internet.</em>",
                          navSelector     : "div.navigation",
                          contentSelector : null,           // not really a selector. :) it's whatever the method was called on..
                          extraScrollPx   : 150,
                          itemSelector    : "div.post",
                          animate         : false,
                          scrollElem      : false,
                          bufferPx        : 40,
                          errorCallback   : function(){}
                        }, 
        loadingImg    : undefined,
        loadingMsg    : undefined,
        container     : undefined,
        currPage      : 1,
        currDOMChunk  : null,  // defined in setup()'s load()
        isDuringAjax  : false,
        isInvalidPage : false,
        isDone        : false  // for when it goes all the way through the archive.
  };
  


})(jQuery);
