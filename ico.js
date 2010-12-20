var github = { user: "sublee", repo: "ico", branch: "master" };

function urlJoin() {
    return Array.prototype.join.call( arguments, "/" );
}

function blobs( github, callback ) {
    var prefix = "http://github.com/api/v2/json/blob/all",
        url = urlJoin( prefix, github.user, github.repo, github.branch ),
        script = $( "<script></script>" );
    callback = callback || "callback";
    script.attr( "src", url + "?callback=" + callback );
    script.appendTo( document.body );
}

function parsePath( path ) {
    var dirname = path.split( "/" ),
        filename = dirname.pop(),
        name = filename.replace( /(\[\d+\])?\.ico$/, "" ).replace( /;/g, "/" ),
        id = name.replace( /[.\/]/g, "-" ),
        match = filename.match( /\[(\d+)\]\.ico/ ),
        generation = match ? match[ 1 ] : null,
        url = null,
        img = urlJoin(
            "https://github.com", github.user, github.repo, "raw",
            github.branch, path
        );
    if ( /\./.exec( name ) ) {
        url = "http://" + name;
    }
    return {
        dirname: dirname,
        filename: filename,
        name: name,
        id: id,
        generation: generation,
        url: url,
        img: img
    };
}

function gallery( data ) {
    try {
        var blobs = data.blobs,
            legacyBlobs = [],
            articleTemplate = $( "article.template" ),
            sectionTemplate = $( "section.template" ),
            realize = function( elem ) {
                return $( elem ).clone( true ).removeClass( "template" );
            };

        $.each( blobs, function( path, sha ) {
            if ( !/\.ico$/.exec( path ) ) {
                return;
            }
            var blob = parsePath( path );

            if ( blob.generation ) {
                legacyBlobs.push( blob );
                return;
            }

            var article = realize( articleTemplate ),
                sectionId = blob.dirname.join( "-" ),
                section = $( "section#" + sectionId );

            if ( !section.length ) {
                section = realize( sectionTemplate );
                section.attr( "id", sectionId );
                section.find( "h2" ).text( blob.dirname.join( "/" ) );
                section.appendTo( sectionTemplate.parent() );
            }

            if ( blob.url ) {
                article.children( "a" ).attr( "href", blob.url );
            } else {
                article.find( "img" ).unwrap().wrap( "<i></i>" );
            }

            article.find( "img" ).attr( "src", blob.img );
            article.find( ".name" ).text( blob.name );
            article.attr( "id", blob.id );
            article.appendTo( section );
        });

        $.each( legacyBlobs, function( i, blob ) {
            var article = $( "article#" + blob.id ),
                generations = article.find( "sub" ),
                img = article.find( "img:eq(0)" ),
                legacy = img.clone().addClass( "legacy" );
            legacy.attr( "src", blob.img ).insertAfter( img );
            if ( !generations.length ) {
                generations = $( "<sub>1</sub>" ).appendTo( img.parent() );
            }
            generations.text( parseInt( generations.text() ) + 1 );
        });

        $( document.body ).addClass( "loaded" );

        var clear = $( "<div></div>" ).css( "clear", "left" );
        clear.appendTo( sectionTemplate.parent() );

        setInterval(function() {
            var icons = $( "img" ),
                icon = icons.eq( Math.floor( Math.random() * icons.length ) );
            $( "link[rel='shortcut icon']" ).attr( "href", icon.attr( "src" ) );
        }, 1000 );
    } catch ( err ) {
        err = $( "<div class='error'></div>" ).text( err.message );
        $( document.body ).addClass( "errored" ).append( err );
    }
}

blobs( github, "gallery" );
