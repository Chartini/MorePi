(function() {
  /*
  MorePi Mock RESTful API example application script
  Copyright (c) 2011 Jason Stehle
  
  Permission is hereby granted, free of charge, to any person obtaining 
  a copy of this software and associated documentation files (the 
  "Software"), to deal in the Software without restriction, including 
  without limitation the rights to use, copy, modify, merge, publish, 
  distribute, sublicense, and/or sell copies of the Software, and to 
  permit persons to whom the Software is furnished to do so, subject to 
  the following conditions:
  
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, 
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF 
  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE 
  LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION 
  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION 
  WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  
  Dependencies:
  jQuery (http://jquery.com/)
  Milk (https://github.com/pvande/Milk/)
  */
  var App, Mocks;
  App = {};
  /* BEGIN MorePi population */
  Mocks = {};
  Mocks.initialAuthors = [
    {
      "id": "0",
      "name": "Alfred Bester"
    }, {
      "id": "1",
      "name": "Orson Scott Card"
    }, {
      "id": "2",
      "name": "George RR Martin"
    }, {
      "id": "3",
      "name": "Richard K Morgan"
    }, {
      "id": "4",
      "name": "Chris Moriarty"
    }, {
      "id": "5",
      "name": "Tim Powers"
    }
  ];
  Mocks.initialBooks = [
    {
      "id": "___id___",
      "name": "The Stars My Destination",
      "author": "0"
    }, {
      "id": "___id___",
      "name": "The Demolished Man",
      "author": "0"
    }, {
      "id": "___id___",
      "name": "Spin State",
      "author": "4"
    }, {
      "id": "___id___",
      "name": "Spin Control",
      "author": "4"
    }, {
      "id": "___id___",
      "name": "Altered Carbon",
      "author": "3"
    }, {
      "id": "___id___",
      "name": "Broken Angels",
      "author": "3"
    }, {
      "id": "___id___",
      "name": "Woken Furies",
      "author": "3"
    }, {
      "id": "___id___",
      "name": "The Anubis Gates",
      "author": "5"
    }, {
      "id": "___id___",
      "name": "Last Call",
      "author": "5"
    }, {
      "id": "___id___",
      "name": "Ender's Game",
      "author": "1"
    }
  ];
  App.resetData = function() {
    var author, batch, book, c, i, requestCount, _i, _j, _len, _len2, _ref, _ref2;
    batch = new $.AjaxBatch();
    $.bjax(batch, {
      url: "/api/0.0/",
      type: "DELETE"
    });
    _ref = Mocks.initialBooks;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      book = _ref[_i];
      $.bjax(batch, {
        url: "/api/0.0/books/",
        type: "POST",
        data: JSON.stringify(book)
      });
    }
    requestCount = batch.getCount();
    for (i = 1; i < requestCount; i += 1) {
      for (c = 0; 0 <= i ? c <= i : c >= i; 0 <= i ? c++ : c--) {
        $.bjax(batch, {
          url: "/api/0.0/books/{{{responses." + i + ".message}}}/chapters/",
          type: "POST",
          data: JSON.stringify({
            "id": "___id___",
            "name": "Chapter " + (c + 1)
          })
        });
      }
    }
    _ref2 = Mocks.initialAuthors;
    for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
      author = _ref2[_j];
      $.bjax(batch, {
        url: "/api/0.0/authors/" + author.id + "/",
        type: "PUT",
        data: JSON.stringify(author)
      });
    }
    batch.execute(App.resetView);
  };
  /* END MorePi population */
  App.loadMustacheTemplates = function(templatesHtml) {
    var i, key, parts, templates, _ref;
    parts = templatesHtml.split("~~~~");
    templates = {};
    key = null;
    for (i = 0, _ref = parts.length; i < _ref; i += 1) {
      if (i === 0) {
        continue;
      }
      if (i % 2 === 1) {
        key = parts[i];
      } else {
        templates[key] = parts[i];
      }
    }
    Milk.partials = templates;
  };
  App.templates = '\
~~~~books_list~~~~\
<h2>Books</h2>\
{{>book_table}}\
\
\
~~~~book_table~~~~\
{{#books.length}}\
  <table>\
  {{#books}}\
    <tr>\
    <td><span class="get get-book" data-id="{{id}}" title="{{id}}">{{name}}</span></td>\
    <td><button class="edit-book" data-id="{{id}}">Edit</button></td>\
    <td><button class="delete-book" data-id="{{id}}">Delete</button></td>\
    </tr>\
  {{/books}}\
  </table>\
{{/books.length}}\
{{^books.length}}\
  <p>No books.</p>\
{{/books.length}}\
\
\
~~~~book_view~~~~\
<h2 title="{{id}}">{{name}}</h2>\
\
<p><button class="edit-book" data-id="{{id}}">Edit</button></p>\
\
<h3>Author</h3>\
{{#authors}}\
  <p>By <span class="get get-author" data-id="{{id}}" title="{{id}}">{{name}}</span></p>\
{{/authors}}\
\
{{#chapters.length}}\
  <h3>Chapters</h3>\
  <table>\
  {{#chapters}}\
    <tr>\
    <td title="{{id}}">{{name}}</td>\
    <td><button class="edit-chapter" data-id="{{id}}" data-book-id="{{bookId}}">Edit</button></td>\
    <td><button class="delete-chapter" data-id="{{id}}" data-book-id="{{bookId}}">Delete</button></td>\
    </tr>\
  {{/chapters}}\
  </table>\
{{/chapters.length}}\
\
\
~~~~authors_list~~~~\
<h2>Authors</h2>\
<button class="add-author">Add author</button><br/>\
{{#authors.length}}\
  <table>\
  {{#authors}}\
    <tr>\
    <td><span class="get get-author" data-id="{{id}}" title="{{id}}">{{name}}</span></td>\
    <td><button class="edit-author" data-id="{{id}}">Edit</button></td>\
    </tr>\
  {{/authors}}\
  </table>\
{{/authors.length}}\
{{^authors.length}}\
  <p>No authors.</p>\
{{/authors.length}}\
\
\
~~~~author_view~~~~\
<h2 title="{{id}}">{{name}} <button class="edit-author" data-id="{{id}}">Edit</button></h2>\
\
<h3>Books</h3>\
{{>book_table}}\
';
  App.renderTemplate = function(templateName, data) {
    var result;
    result = Milk.render(Milk.partials[templateName], data);
    $("#main").html(result);
  };
  App.compareByName = function(a, b) {
    if (a.name > b.name) {
      return 1;
    } else if (a.name < b.name) {
      return -1;
    } else {
      return 0;
    }
  };
  App.displayBooksList = function(response) {
    response.books.sort(App.compareByName);
    return App.renderTemplate("books_list", response);
  };
  App.getBooksList = function(batch) {
    App.currentView = "getBooksList";
    return $.bjax(batch, {
      url: "/api/0.0/books/",
      type: "GET",
      success: App.displayBooksList
    });
  };
  App.editBook = function(id) {
    var batch, name;
    name = prompt("Please enter the book's name:");
    if (name != null) {
      batch = new $.AjaxBatch();
      $.bjax(batch, {
        url: "/api/0.0/books/" + id + "/",
        type: "POST",
        data: JSON.stringify({
          "name": name
        })
      });
      return batch.execute(App.refreshView);
    }
  };
  App.editChapter = function(id, bookId) {
    var batch, name;
    name = prompt("Please enter the chapter's name:");
    if (name != null) {
      batch = new $.AjaxBatch();
      $.bjax(batch, {
        url: "/api/0.0/books/" + bookId + "/chapters/" + id + "/",
        type: "POST",
        data: JSON.stringify({
          "name": name
        })
      });
      return batch.execute(App.refreshView);
    }
  };
  App.deleteChapter = function(id, bookId) {
    var batch;
    batch = new $.AjaxBatch();
    $.bjax(batch, {
      url: "/api/0.0/books/" + bookId + "/chapters/" + id + "/",
      type: "DELETE"
    });
    return batch.execute(App.refreshView);
  };
  App.deleteBook = function(id) {
    var batch;
    batch = new $.AjaxBatch();
    $.bjax(batch, {
      url: "/api/0.0/books/" + id + "/",
      type: "DELETE"
    });
    return batch.execute(App.refreshView);
  };
  App.displayBook = function(response) {
    var book;
    if (response.responses.length > 2) {
      book = response.responses[response.responses.length - 3];
      book.chapters = response.responses[response.responses.length - 2].chapters;
      book.authors = response.responses[response.responses.length - 1];
      book.chapters.sort(App.compareByName);
      book.bookId = book.id;
      return App.renderTemplate("book_view", book);
    }
  };
  App.getBook = function(id) {
    var batch;
    App.currentView = "getBook|" + id;
    batch = new $.AjaxBatch();
    $.bjax(batch, {
      url: "/api/0.0/books/" + id + "/",
      type: "GET"
    });
    $.bjax(batch, {
      url: "/api/0.0/books/" + id + "/chapters/",
      type: "GET"
    });
    $.bjax(batch, {
      url: "/api/0.0/authors/{{{responses.0.author}}}/",
      type: "GET"
    });
    batch.execute(App.displayBook);
  };
  App.displayAuthorsList = function(response) {
    response.authors.sort(App.compareByName);
    return App.renderTemplate("authors_list", response);
  };
  App.getAuthorsList = function() {
    App.currentView = "getAuthorsList";
    return $.bjax(null, {
      url: "/api/0.0/authors/",
      type: "GET",
      success: App.displayAuthorsList
    });
  };
  App.addAuthor = function() {
    var batch, name;
    name = prompt("Please enter the author's name:");
    if (name != null) {
      batch = new $.AjaxBatch();
      $.bjax(batch, {
        url: "/api/0.0/authors/",
        type: "POST",
        data: JSON.stringify({
          "id": "___id___",
          "name": name
        })
      });
      return batch.execute(App.refreshView);
    }
  };
  App.editAuthor = function(id) {
    var batch, name;
    name = prompt("Please enter the author's name:");
    if (name != null) {
      batch = new $.AjaxBatch();
      $.bjax(batch, {
        url: "/api/0.0/authors/" + id + "/",
        type: "POST",
        data: JSON.stringify({
          "name": name
        })
      });
      batch.execute(App.refreshView);
    }
  };
  App.displayAuthor = function(response) {
    var author;
    if (response.responses.length === 2) {
      author = response.responses[0];
      author.books = response.responses[1].books;
      return App.renderTemplate("author_view", author);
    }
  };
  App.getAuthor = function(id) {
    var batch;
    App.currentView = "getAuthor|" + id;
    batch = new $.AjaxBatch();
    $.bjax(batch, {
      url: "/api/0.0/authors/" + id + "/",
      type: "GET"
    });
    $.bjax(batch, {
      url: "/api/0.0/books/?author=" + id,
      type: "GET"
    });
    batch.execute(App.displayAuthor);
    return false;
  };
  App.refreshView = function() {
    var func, parts;
    parts = App.currentView.split('|');
    func = parts.shift();
    App[func].apply(App, parts);
  };
  App.resetView = function() {
    return App.getBooksList();
  };
  App.ajaxSetup = function() {
    return $.ajaxSetup({
      beforeSend: function(xhr, settings) {
        var csrf;
        if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
          csrf = $("input[name=csrfmiddlewaretoken]").val();
          if (csrf != null) {
            return xhr.setRequestHeader("X-CSRFToken", csrf);
          }
        }
      }
    });
  };
  App.init = function() {
    App.ajaxSetup();
    App.loadMustacheTemplates(App.templates);
    $(document.body).delegate('.add-author', 'click', function(e) {
      return App.addAuthor();
    }).delegate('.get-books-list', 'click', function(e) {
      return App.getBooksList();
    }).delegate('.get-authors-list', 'click', function(e) {
      return App.getAuthorsList();
    }).delegate('.get-book', 'click', function(e) {
      return App.getBook($(this).data("id"));
    }).delegate('.get-author', 'click', function(e) {
      return App.getAuthor($(this).data("id"));
    }).delegate('.edit-book', 'click', function(e) {
      return App.editBook($(this).data("id"));
    }).delegate('.edit-author', 'click', function(e) {
      return App.editAuthor($(this).data("id"));
    }).delegate('.edit-chapter', 'click', function(e) {
      return App.editChapter($(this).data("id"), $(this).data("bookId"));
    }).delegate('.delete-chapter', 'click', function(e) {
      return App.deleteChapter($(this).data("id"), $(this).data("bookId"));
    }).delegate('.delete-book', 'click', function(e) {
      return App.deleteBook($(this).data("id"));
    }).delegate('#reset-button', 'click', function(e) {
      return App.resetData();
    });
    App.resetView();
  };
  $(function() {
    App.init();
  });
}).call(this);
