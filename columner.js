var columner = (function () {
    
    var fragment = function() {
            return document.createDocumentFragment();
        },

        clone = function( node ) {
            return node.cloneNode( true );
        },

        remove = function( el ) {
            while( el.lastChild )
                el.removeChild( el.lastChild );
        },

        copy = function( collection ) {
            var result  = [],

                copy = function( el ) {
                    result.push( clone( el ) );
                };

            [].forEach.call(collection, copy);

            return result;
        },

        debounce = function( fn, ms ) {
            return function() {
                var timeout,
                    args = arguments,
                    later = function() {
                        fn( args );
                    };

                window.clearTimeout( timeout );
                timeout = window.setTimeout( later, ms );
            };
        },

        extend = function(o /* extObjs */) {
            var extObjs = [].slice.call( arguments, 1 ),
                pushTo = function( obj ) {
                    var prop;

                    for ( prop in obj )
                        if ( obj.hasOwnProperty( prop ) )
                            o[prop] = obj[prop];
                };

            extObjs.forEach( pushTo );

            return o;
        },

        shift = function( collection, ind ) {
            var length = collection.length,
                frag = fragment(),
                i, j;

            if ( ind <= 0 )
                ind = 1;

            for ( i = 0; i < ind; i += 1 )
                for ( j = i; j < length; j += ind )
                    frag.appendChild( collection[j] );

            return frag;
        },

        split = function( frag, ind ) {
            var children = frag.children,
                length = children.length,
                fulls = length % ind,
                rows = Math.ceil( length / ind ),
                isEven = ( fulls === 0 ),
                result = [],
                newFrag,
                i;

            if ( ind <= 0 ) {
                newFrag = fragment();
                
                while ( children.length )
                    newFrag.appendChild( children[0] );

                result.push( newFrag );
                return result;
            }

            if ( isEven ) {
                while ( ind > 0 ) {
                    newFrag = fragment();
                    
                    for ( i = 0; i < rows; i += 1 )
                        newFrag.appendChild( children[0] );

                    result.push( newFrag );
                    ind -= 1;
                }
                return result;
            }

            while ( fulls > 0 ) {
                newFrag = fragment();

                for ( i = 0; i < rows; i += 1 )
                    newFrag.appendChild( children[0] );

                result.push( newFrag );
                fulls -= 1;
            }

            while ( children.length ) {
                newFrag = fragment();

                for ( i = 0; i < rows - 1; i += 1 )
                    newFrag.appendChild( children[0] );

                result.push( newFrag );
            }

            return result;
        },

        wrap = function( fragsArr, nestStr ) {
            var wrapFrags = function( frag ) {
                return nest( frag, nestStr );
            };

            return fragsArr.map( wrapFrags );
        },

        getWidth = function( el, placement ) {
            var width = el.offsetWidth,

                pl = parseInt( getComputedStyle(el).paddingLeft, 10 ),
                pr = parseInt( getComputedStyle(el).paddingRight, 10);

            switch( placement ) {
                case 'outer':
                    return width;
                case 'inner':
                    return width - pl - pr;
            }
        },

        getFitableCols = function( el ) {
            var child = el.children[0],
                parWidth = getWidth( el, 'inner' ),
                chiWidth = getWidth( child, 'outer' );

            if ( chiWidth > parWidth )
                return 1;

            return Math.floor( parWidth / chiWidth );
        },

        replace = function( el, collection, nestStr ) {
            var cols = getFitableCols( el ),
                shifted = shift( collection, cols ),
                splitted = split( shifted, cols ),
                wrapped = wrap( splitted, nestStr ),

                appendEls = function( newEl ) {
                    el.appendChild( newEl );
                };

            remove( el );

            wrapped.forEach( appendEls );
        },

        replaceOnResize = function( el, collection, nestStr, delay ) {
            var cache = { cols: getFitableCols( el ) },

                replaceEls = debounce(function() {
                    var cols = getFitableCols( el );

                    if ( cache.cols === cols )
                        return;

                    cache.cols = cols;

                    replace( el, collection, nestStr );
                }, delay);

            window.addEventListener( 'resize', replaceEls, false );
        };

        return function columner( selector, options ) {
            var els = document.querySelectorAll( selector ),
                defaults = {
                    delay: 500
                },

                replaceEach = function( el ) {
                    var data = JSON.parse( el.dataset.columner || "{}" ),
                        settings = extend( defaults, options, data ),
                        collection = copy( el.children );

                    replace( el, collection, settings.nest );
                    replaceOnResize( el, collection, settings.nest, settings.delay );
                };
            
            [].forEach.call( els, replaceEach );
        };
        
}());