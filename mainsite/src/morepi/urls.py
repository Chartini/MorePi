from django.conf.urls.defaults import patterns

urlpatterns = patterns('',
    (r'^(.+)?$', 'morepi.views.mock_request_entry_point'),
    )


