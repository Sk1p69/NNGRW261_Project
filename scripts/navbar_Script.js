$(function() {
$(document).scroll(function(){
    var $nav = $("#mainNavbar");
    $nav.toggleClass("scrolled", $(this).scrollTop() > $nav.height());
});
});
// Die script kyk hoe ver die user gescroll het van die top van die bladsy
// As die user meer gescroll het as die hoogte van die navbar dan toggle dit die "scrolled" class
// Dit word gebruik om die agtergrond kleur van die navbar te verander sodat dit uitstaan