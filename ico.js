var github = { user: "sublee", repo: "ico", branch: "master" };

function urlJoin() {
    return Array.prototype.join.call( arguments, "/" );
}

function fetchContents( github, path, callbackName ) {
    var prefix = "https://api.github.com/repos",
        suffix = "contents",
        url = urlJoin( prefix, github.user, github.repo, suffix ),
        script = $( "<script></script>" );
    if ( path ) {
        url = urlJoin( url, path );
    }
    script.attr( "src", url + "?callback=" + callbackName );
    script.appendTo( document.body );
}

function collectIconsAndRenderGallery( result ) {
    var func = arguments.callee;
    if ( func.todo === undefined ) {
        func.todo = 0;
        func.icons = [];
    } else {
        func.todo--;
    }
    $.each( result.data, function( i, content ) {
        if ( content.type === "dir" ) {
            func.todo++;
            fetchContents( github, content.path, func.name );
        } else if ( /\.ico$/.exec( content.path ) ) {
            func.icons.push( parseIconPath( content.path ) );
        }
    });
    if ( !func.todo ) {
        renderGallery( func.icons );
    }
}

function parseIconPath( path ) {
    var dirname = path.split( "/" ),
        filename = dirname.pop(),
        name = filename.replace( /(\[\d+\])?\.ico$/, "" ).replace( /;/g, "/" ),
        match = filename.match( /\[(\d+)\]\.ico/ ),
        generation = match ? match[ 1 ] : null,
        url = null,
        img = urlJoin(
            "https://github.com", github.user, github.repo, "raw",
            github.branch, encodeURIComponent( path )
        );
    if ( match = /^([^(]+)\((.+)\)/.exec( name ) ) {
        url = "http://" + match[ 2 ].replace( /\\/g, "/" );
        name = match[ 1 ];
    } else if ( /\./.exec( name ) ) {
        url = "http://" + name;
    }
    return {
        dirname: dirname,
        filename: filename,
        name: name,
        id: name.replace( /[.\/]/g, "-" ),
        generation: generation,
        url: url,
        img: img
    };
}

function renderGallery( icons ) {
    try {
        var legacyIcons = [],
            articleTemplate = $( "article.template" ),
            sectionTemplate = $( "section.template" ),
            realize = function( elem ) {
                return $( elem ).clone( true ).removeClass( "template" );
            };
        $.each( icons, function( i, icon ) {
            if ( icon.generation ) {
                legacyIcons.push( icon );
                return;
            }
            var article = realize( articleTemplate ),
                sectionId = icon.dirname.join( "-" ),
                section = $( "section#" + sectionId );
            if ( !section.length ) {
                section = realize( sectionTemplate );
                section.attr( "id", sectionId );
                section.find( "h2" ).text( icon.dirname.join( "/" ) );
                section.appendTo( sectionTemplate.parent() );
            }
            if ( icon.url ) {
                article.children( "a" ).attr( "href", icon.url );
            } else {
                article.find( "img" ).unwrap().wrap( "<i></i>" );
            }
            article.find( "img" ).attr( "src", icon.img );
            article.find( ".name" ).text( icon.name );
            article.attr( "id", icon.id );
            article.appendTo( section );
        });
        legacyIcons.sort(function( x, y ) {
            return x.generation < y.generation ? -1 : 1;
        });
        $.each( legacyIcons, function( i, icon ) {
            var article = $( "article#" + icon.id ),
                generations = article.find( "sub" ),
                imgs = article.find( "img" ),
                eq = Math.min( icon.generation, imgs.length ),
                img = imgs.eq( imgs.length - eq ),
                legacy = img.clone().addClass( "legacy" );
            legacy.attr( "src", icon.img ).insertAfter( img );
            if ( !generations.length ) {
                generations = $( "<sub>1</sub>" ).appendTo( img.parent() );
            }
            generations.text( parseInt( generations.text() ) + 1 );
        });
        var sections = $( "section:not(.template)" ).remove();
        sections.sort(function( x, y ) {
            x = $( x ).find( "article" ).length,
            y = $( y ).find( "article" ).length;
            return x === y ? 0 : x < y ? 1 : -1;
        });
        sectionTemplate.parent().append( sections );
        $( document.body ).addClass( "loaded" );
        var clear = $( "<div></div>" ).css( "clear", "left" );
        clear.appendTo( sectionTemplate.parent() );
    } catch ( err ) {
        err = $( "<div class='error'></div>" ).text( err.message );
        $( document.body ).addClass( "errored" ).append( err );
    }
}

fetchContents( github, null, "collectIconsAndRenderGallery" );
