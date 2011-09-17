from django.conf.urls.defaults import patterns, include

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
                       
    (r'^$', 'mainsite.views.home'),           
    (r'^api/0.0/', include('morepi.urls')),
    
)
