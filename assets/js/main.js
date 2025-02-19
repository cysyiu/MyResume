document.addEventListener('DOMContentLoaded', () => {
  "use strict";

  // Easy selector helper function
  const select = (el, all = false) => {
    el = el.trim();
    if (all) {
      return [...document.querySelectorAll(el)];
    } else {
      return document.querySelector(el);
    }
  };

  // Easy event listener function
  const on = (type, el, listener, all = false) => {
    let selectEl = select(el, all);
    if (selectEl) {
      if (all) {
        selectEl.forEach(e => e.addEventListener(type, listener));
      } else {
        selectEl.addEventListener(type, listener);
      }
    }
  };

  // Easy on scroll event listener 
  const onscroll = (el, listener) => {
    el.addEventListener('scroll', listener);
  };

  // Navbar links active state on scroll
  const navbarlinks = select('#navbar .scrollto', true);
  const navbarlinksActive = () => {
    let position = window.scrollY + 200;
    navbarlinks.forEach(navbarlink => {
      if (!navbarlink.hash) return;
      let section = select(navbarlink.hash);
      if (!section) return;
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        navbarlink.classList.add('active');
      } else {
        navbarlink.classList.remove('active');
      }
    });
  };

  // Scroll to an element with header offset
  const scrollto = (el) => {
    let elementPos = select(el).offsetTop;
    window.scrollTo({
      top: elementPos,
      behavior: 'smooth'
    });
  };

  // Back to top button
  const toggleBacktotop = () => {
    const backtotop = select('.back-to-top');
    if (backtotop) {
      if (window.scrollY > 100) {
        backtotop.classList.add('active');
      } else {
        backtotop.classList.remove('active');
      }
    }
  };

  // Mobile nav toggle
  const mobileNavToggle = () => {
    const body = select('body');
    const mobileNav = select('.mobile-nav-toggle');
    if (body && mobileNav) {
      body.classList.toggle('mobile-nav-active');
      mobileNav.classList.toggle('bi-list');
      mobileNav.classList.toggle('bi-x');
    }
  };

  // Hero type effect initialization
  const initTyped = () => {
    const typed = select('.typed');
    if (typed) {
      let typed_strings = typed.getAttribute('data-typed-items').split(',');
      new Typed('.typed', {
        strings: typed_strings,
        typeSpeed: 100,
        backSpeed: 50,
        loop: true,
        backDelay: 2000
      });
    }
  };

  // Skills animation
  const initSkillsAnimation = () => {
    let skillsContent = select('.skills-content');
    if (skillsContent) {
      new Waypoint({
        element: skillsContent,
        offset: '80%',
        handler: function(direction) {
          let progress = select('.progress .progress-bar', true);
          progress.forEach(el => el.style.width = el.getAttribute('aria-valuenow') + '%');
        }
      });
    }
  };

  // Portfolio isotope and filter
const initPortfolioIsotope = () => {
    const portfolioContainer = select('.portfolio-container');
    
    if (portfolioContainer) {
        const portfolioIsotope = new Isotope(portfolioContainer, {
            itemSelector: '.portfolio-item',
            filter: '.filter-carto'
        });

        const portfolioFilters = select('#portfolio-flters li', true);
        
        // Set cartography filter as active by default
        portfolioFilters.forEach(el => {
            if (el.getAttribute('data-filter') === '.filter-carto') {
                el.classList.add('filter-active');
            } else {
                el.classList.remove('filter-active');
            }
        });

        on('click', '#portfolio-flters li', function(e) {
            e.preventDefault();
            portfolioFilters.forEach(el => el.classList.remove('filter-active'));
            this.classList.add('filter-active');
            
            // Get the filter value
            const filterValue = this.getAttribute('data-filter');
            portfolioIsotope.arrange({ filter: filterValue });
            
            // If weather dashboard is selected, reinitialize the map
            if (filterValue === '.filter-wd') {
                setTimeout(() => {
                    if (map && typeof map.updateSize === 'function') {
						map.updateSize();
					}
                }, 100);
            }
            
            portfolioIsotope.on('arrangeComplete', () => AOS.refresh());
        }, true);
    }
};



  // Initialize GLightbox
  const initGLightbox = () => {
    GLightbox({ selector: '.glightbox' });
    GLightbox({ selector: '.portfolio-lightbox' });
    GLightbox({ selector: '.portfolio-details-lightbox', width: '90%', height: '90vh' });
  };

  // Initialize Swiper for portfolio details slider
  const initSwiper = () => {
    new Swiper('.portfolio-details-slider', {
      speed: 400,
      loop: true,
      autoplay: { delay: 5000, disableOnInteraction: false },
      pagination: { el: '.swiper-pagination', type: 'bullets', clickable: true }
    });
  };

  // Initialize PureCounter
  const initPureCounter = () => {
    new PureCounter();
  };

  // Event listeners and initializations
  window.addEventListener('load', () => {
    navbarlinksActive();
    toggleBacktotop();
    initPortfolioIsotope();
    AOS.init({ duration: 1000, easing: 'ease-in-out', once: true, mirror: false });
  });

  onscroll(document, navbarlinksActive);
  onscroll(document, toggleBacktotop);

  on('click', '.mobile-nav-toggle', mobileNavToggle);
  on('click', '.scrollto', function(e) {
    if (select(this.hash)) {
      e.preventDefault();
      if (select('body').classList.contains('mobile-nav-active')) {
        mobileNavToggle();
      }
      scrollto(this.hash);
    }
  }, true);

  if (window.location.hash) {
    scrollto(window.location.hash);
  }

  if (select('#preloader')) {
    select('#preloader').remove();
  }

  initTyped();
  initSkillsAnimation();
  initGLightbox();
  initSwiper();
  initPureCounter();

});

