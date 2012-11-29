AC_PREREQ(2.63)
AC_INIT([welcome-to-gnome],[0.1],[http://gnome.org])

AM_INIT_AUTOMAKE([1.10 dist-bzip2 no-dist-gzip foreign tar-ustar])

GETTEXT_PACKAGE=welcometognome
AC_SUBST(GETTEXT_PACKAGE)
AC_DEFINE_UNQUOTED(GETTEXT_PACKAGE, "$GETTEXT_PACKAGE",
                   [The prefix for our gettext translation domains.])
IT_PROG_INTLTOOL(0.26)

AM_GLIB_GNU_GETTEXT

AC_OUTPUT([
Makefile
po/Makefile.in
src/Makefile
])
