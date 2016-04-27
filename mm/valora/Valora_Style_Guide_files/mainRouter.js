var havenRoutes = { //eslint-disable-line
    enter: function (route) {

        controller.isWaiting = false;

        if (amorphic.state == 'zombie') {
            this.file = '';
        } else {
            this.oldPage = this.page;

            if (route.popup) {
                this.popup = route.popup;
                controller.bigEscape();
            } else {
                this.page = route.getId();
                this.file = route.file;
                this.pageTitle  = route.title;
                this.bodyClass  = route.bodyClass;
            }

            if (route.step) { this.navigationStep = route.step; }

            this.analyticsController.addVirtualPage(route.getId());

        }
    },
    exit: function () {
    },
    routes: {
        private: {
            path: '',
            enter: function() {

                this.analyticsController.inspectletEvent(['virtualPage'], true);

                if (!this.loggedIn) {
                    this.route.public.home();
                    return;
                }
            },
            routes: {
                quoteReturn: {
                    title: 'Quote Return',
                    path: '-/#quote-return',
                    file: 'pages/quote-return.html',
                    bodyClass: 'quote-return',
                    enter: function() {
                        this.quoteReturnController.routeEntered();
                    },
                    exit: function() {
                        this.quoteReturnController.routeExited();
                    }
                },
                accountCenter: {
                    title: 'Account Center',
                    path: '-/#account-center',
                    file: 'pages/account-center.html',
                    bodyClass: 'account-center',
                    enter: function() {
                        this.accountCenterController.fireEvents();
                        this.accountCenterController.routeEntered();
                    }
                },
                application: {
                    title: 'Application',
                    path: '-/#application',
                    file: 'pages/application.html',
                    bodyClass: 'application',
                    enter: function () {
                        this.valoraAppController.routeEntered();
                    },
                    exit: function() {
                        this.valoraAppController.routeExited();
                    }
                },
                applicationProcessing: {
                    title: 'Application Processing',
                    path: '-/#application-processing',
                    file: 'pages/application-processing.html',
                    bodyClass: 'application-processing',
                    enter: function() {
                        this.applicationProcessingController.routeEntered();
                    },
                    exit: function() {
                        this.applicationProcessingController.routeExited();
                    }
                },
                verify_email: {
                    parameters: {
                        email: {
                            bind: 'email'
                        },
                        code: {
                            bind: 'verifyEmailCode'
                        }
                    },
                    enter: function () {
                        this.verifyEmail(this.oldPage);
                    }
                },
                dialog: {
                    enter: function() {
                        this.clearErrorMessages();
                    },
                    routes: {
                        cancelPolicy: {
                            path: 'cancel-policy',
                            nested: true,
                            popup: 'partials/modals/cancel-policy.html'
                        },
                        cancelPolicyInfo: {
                            path: 'cancel-policy-info',
                            nested: true,
                            popup: 'partials/modals/cancel-policy-info.html'
                        },
                        cancelApplication: {
                            path: 'cancel-application',
                            nested: true,
                            popup: 'partials/modals/cancel-application.html'
                        },
                        offerAccepted: {
                            path: 'offer-accepted',
                            nested: true,
                            popup: 'partials/modals/offer-accepted.html'
                        },
                        scheduleExam: {
                            path: 'schedule-exam',
                            nested: true,
                            popup: 'partials/modals/schedule-exam.html'
                        },
                        correspondenceDocs: {
                            path: 'correspondence-docs',
                            nested: true,
                            popup: 'partials/modals/correspondence-docs.html'
                        },
                        policyDocs: {
                            path: 'policy-docs',
                            nested: true,
                            popup: 'partials/modals/policy-docs.html'
                        },
                        resendEsign: {
                            path: 'resend-esign',
                            nested: true,
                            popup: 'partials/modals/resend-esign.html'
                        },
                        policyDetails: {
                            path: 'policy-details',
                            nested: true,
                            popup: 'partials/modals/policy-details.html'
                        },
                        emailChangeVerified: {
                            nested: true,
                            popup: 'partials/modals/email-change-verified.html'
                        },
                        resetPassword: {
                            nested: true,
                            popup: 'partials/modals/reset.html'
                        },
                        resetPasswordInfo: {
                            nested: true,
                            popup: 'partials/modals/reset-password-info.html',
                            enter: function () {
                                this.accountCenterController.routeEntered();
                            }
                        },
                        changeEmail: {
                            nested: true,
                            popup: 'partials/modals/change-email.html',
                            enter: function () {
                                this.accountCenterController.editOwnerEmail();
                            },
                            exit: function(){
                                this.accountCenterController.cancelEditOwnerEmail();
                            }
                        }
                    }
                }
            }
        },
        public: {
            path: '',
            enter: function () {
                this.analyticsController.inspectletEvent(['virtualPage'], true);
                
                this.updateActiveNavLink();
            },
            exit: function () {
            },
            routes: {
                index: {
                    title: 'ValoraLife',
                    path: '',
                    file: 'pages/home.html',
                    bodyClass: 'home',
                    enter: function () {
                        this.routeEntered();
                    },
                    exit: function () {
                    }
                },
                home: {
                    title: 'ValoraLife',
                    path: '-/',
                    file: 'pages/home.html',
                    bodyClass: 'home',
                    enter: function () {
                        this.routeEntered();
                    },
                    exit: function () {
                        this.routeExited();
                    }
                },
                quote: {
                    title: 'Quote',
                    path: '-/#quote',
                    file: 'pages/quote.html',
                    bodyClass: 'quote',
                    enter: function () {
                        this.quoteController.routeEntered();
                    },
                    exit: function () {
                        this.quoteController.routeExited();
                    }
                },
                quoteResults: {
                    title: 'Quote Results',
                    path: '-/#quote-results',
                    file: 'pages/quote-results.html',
                    bodyClass: 'quote-results',
                    enter: function () {
                        this.quoteResultsController.routeEntered();
                    },
                    exit: function () {
                        this.quoteResultsController.routeExited();
                    }
                },
                difference: {
                    title: 'Difference',
                    path: '-/difference.html',
                    file: 'pages/difference.html',
                    bodyClass: 'difference',
                    enter: function () {
                        this.differenceController.routeEntered();
                    },
                    exit: function () {
                        this.differenceController.routeExited();
                    }
                },
                faqs: {
                    title: 'FAQs',
                    path: '-/faqs.html',
                    file: 'pages/faqs.html',
                    bodyClass: 'faqs'
                },
                faqsAnswers: {
                    title: 'FAQs - Answers',
                    path: '-/faqs-answers.html',
                    file: 'pages/faqs-answers.html',
                    bodyClass: 'faqs-answers',
                    enter: function () {
                        this.faqsAnswersController.routeEntered();
                    },
                    exit: function () {
                        this.faqsAnswersController.routeExited();
                    }
                },
                verify_email: {
                    parameters: {
                        email: {bind: 'email'},
                        code: {bind: 'verifyEmailCode'}
                    },
                    enter: function () {
                        this.verifyEmail(this.oldPage);
                    }
                },
                verify_email_change: {
                    parameters: {
                        code: { bind: 'verifyEmailCode'}
                    },
                    enter: function () {
                        this.route.public.dialog.loginNewEmail();
                    }
                },
                reset_password_from_code: {
                    parameters: {
                        email: {bind: 'email'},
                        token: {bind: 'passwordChangeHash'}
                    },
                    enter: function () {
                        this.route.public.dialog.changePasswordFromReset();
                    }
                },


                // FAQ Process section
                faqsProcess: {
                    path: '#process',
                    file: 'pages/faqs-answers.html',
                    bodyClass: 'faqs-answers',
                    enter: function () {
                        this.faqsAnswersController.routeEntered();
                    },
                    exit: function () {
                        this.faqsAnswersController.routeExited();
                    }
                },
                faqsProcessBuy: {
                    path: '#what-is-the-process-like-to-buy',
                    file: 'pages/faqs-answers.html',
                    bodyClass: 'faqs-answers',
                    enter: function () {
                        this.faqsAnswersController.routeEntered();
                    },
                    exit: function () {
                        this.faqsAnswersController.routeExited();
                    }
                },
                faqsHowLongToBuy: {
                    path: '#how-long-will-it-take-to-buy',
                    file: 'pages/faqs-answers.html',
                    bodyClass: 'faqs-answers',
                    enter: function () {
                        this.faqsAnswersController.routeEntered();
                    },
                    exit: function () {
                        this.faqsAnswersController.routeExited();
                    }
                },
                faqsInfoToCompleteApp: {
                    path: '#what-info-do-i-need-to-complete-the-app',
                    file: 'pages/faqs-answers.html',
                    bodyClass: 'faqs-answers',
                    enter: function () {
                        this.faqsAnswersController.routeEntered();
                    },
                    exit: function () {
                        this.faqsAnswersController.routeExited();
                    }
                },
                faqsTlic: {
                    path: '#what-is-tlic',
                    file: 'pages/faqs-answers.html',
                    bodyClass: 'faqs-answers',
                    enter: function () {
                        this.faqsAnswersController.routeEntered();
                    },
                    exit: function () {
                        this.faqsAnswersController.routeExited();
                    }
                },
                faqsWhyMedExam: {
                    path: '#why-do-i-have-to-have-a-medical-exam',
                    file: 'pages/faqs-answers.html',
                    bodyClass: 'faqs-answers',
                    enter: function () {
                        this.faqsAnswersController.routeEntered();
                    },
                    exit: function () {
                        this.faqsAnswersController.routeExited();
                    }
                },
                faqsMedExamInclude: {
                    path: '#what-does-the-medical-exam-include',
                    file: 'pages/faqs-answers.html',
                    bodyClass: 'faqs-answers',
                    enter: function () {
                        this.faqsAnswersController.routeEntered();
                    },
                    exit: function () {
                        this.faqsAnswersController.routeExited();
                    }
                },

                // FAQ policy section
                faqsPolicy: {
                    path: '#policy',
                    file: 'pages/faqs-answers.html',
                    bodyClass: 'faqs-answers',
                    enter: function () {
                        this.faqsAnswersController.routeEntered();
                    },
                    exit: function () {
                        this.faqsAnswersController.routeExited();
                    }
                },
                faqsApplyThenNotNeedPolicy: {
                    path: '#what-if-i-apply-and-then-no-longer-want-a-policy',
                    file: 'pages/faqs-answers.html',
                    bodyClass: 'faqs-answers',
                    enter: function () {
                        this.faqsAnswersController.routeEntered();
                    },
                    exit: function () {
                        this.faqsAnswersController.routeExited();
                    }
                },
                faqsPolicyEnds: {
                    path: '#what-happens-when-the-policy-reaches-the-end-of-term',
                    file: 'pages/faqs-answers.html',
                    bodyClass: 'faqs-answers',
                    enter: function () {
                        this.faqsAnswersController.routeEntered();
                    },
                    exit: function () {
                        this.faqsAnswersController.routeExited();
                    }
                },
                faqsHealthChange: {
                    path: '#what-happens-if-my-health-changes',
                    file: 'pages/faqs-answers.html',
                    bodyClass: 'faqs-answers',
                    enter: function () {
                        this.faqsAnswersController.routeEntered();
                    },
                    exit: function () {
                        this.faqsAnswersController.routeExited();
                    }
                },

                // FAQ payment and payouts
                faqsPaymentPayouts: {
                    path: '#payments-payouts',
                    file: 'pages/faqs-answers.html',
                    bodyClass: 'faqs-answers',
                    enter: function () {
                        this.faqsAnswersController.routeEntered();
                    },
                    exit: function () {
                        this.faqsAnswersController.routeExited();
                    }
                },
                faqsHowToPay: {
                    path: '#how-do-i-pay-for-the-policy',
                    file: 'pages/faqs-answers.html',
                    bodyClass: 'faqs-answers',
                    enter: function () {
                        this.faqsAnswersController.routeEntered();
                    },
                    exit: function () {
                        this.faqsAnswersController.routeExited();
                    }
                },
                faqsStopPay: {
                    path: '#if-i-can-no-longer-pay-what-will-happen',
                    file: 'pages/faqs-answers.html',
                    bodyClass: 'faqs-answers',
                    enter: function () {
                        this.faqsAnswersController.routeEntered();
                    },
                    exit: function () {
                        this.faqsAnswersController.routeExited();
                    }
                },
                faqsSurrenderValora: {
                    path: '#if-i-surrender-valoralife-term-plus-and-surrender-before-end-of-term-will-i-get-my-premium-back',
                    file: 'pages/faqs-answers.html',
                    bodyClass: 'faqs-answers',
                    enter: function () {
                        this.faqsAnswersController.routeEntered();
                    },
                    exit: function () {
                        this.faqsAnswersController.routeExited();
                    }
                },
                faqsBeneficiaryIncomeTax: {
                    path: '#does-the-beneficiary-have-to-pay-income-taxes',
                    file: 'pages/faqs-answers.html',
                    bodyClass: 'faqs-answers',
                    enter: function () {
                        this.faqsAnswersController.routeEntered();
                    },
                    exit: function () {
                        this.faqsAnswersController.routeExited();
                    }
                },
                faqsBeneficiaryAcessPayout: {
                    path: '#how-does-my-beneficiary-access-the-benefit-payout',
                    file: 'pages/faqs-answers.html',
                    bodyClass: 'faqs-answers',
                    enter: function () {
                        this.faqsAnswersController.routeEntered();
                    },
                    exit: function () {
                        this.faqsAnswersController.routeExited();
                    }
                },
                faqsHowLongMoneyPaidOut: {
                    path: '#how-long-does-it-take-for-the-money-to-get-paid-out',
                    file: 'pages/faqs-answers.html',
                    bodyClass: 'faqs-answers',
                    enter: function () {
                        this.faqsAnswersController.routeEntered();
                    },
                    exit: function () {
                        this.faqsAnswersController.routeExited();
                    }
                },

                // FAQ coverage
                faqsCoverage: {
                    path: '#coverage',
                    file: 'pages/faqs-answers.html',
                    bodyClass: 'faqs-answers',
                    enter: function () {
                        this.faqsAnswersController.routeEntered();
                    },
                    exit: function () {
                        this.faqsAnswersController.routeExited();
                    }
                },
                faqsDeathToCover: {
                    path: '#does-the-policy-pay-for-all-types-of-death',
                    file: 'pages/faqs-answers.html',
                    bodyClass: 'faqs-answers',
                    enter: function () {
                        this.faqsAnswersController.routeEntered();
                    },
                    exit: function () {
                        this.faqsAnswersController.routeExited();
                    }
                },
                faqsDisabled: {
                    path: '#if-i-become-disabled-will-i-still-have-coverage',
                    file: 'pages/faqs-answers.html',
                    bodyClass: 'faqs-answers',
                    enter: function () {
                        this.faqsAnswersController.routeEntered();
                    },
                    exit: function () {
                        this.faqsAnswersController.routeExited();
                    }
                },
                faqsCommitSuicide: {
                    path: '#does-the-policy-pay-a-benefit-if-i-commit-suicide',
                    file: 'pages/faqs-answers.html',
                    bodyClass: 'faqs-answers',
                    enter: function () {
                        this.faqsAnswersController.routeEntered();
                    },
                    exit: function () {
                        this.faqsAnswersController.routeExited();
                    }
                },

                // FAQ eligibility
                faqsEligibility: {
                    path: '#eligibility',
                    file: 'pages/faqs-answers.html',
                    bodyClass: 'faqs-answers',
                    enter: function () {
                        this.faqsAnswersController.routeEntered();
                    },
                    exit: function () {
                        this.faqsAnswersController.routeExited();
                    }
                },
                faqsWhoEligible: {
                    path: '#who-is-eligible-to-apply',
                    file: 'pages/faqs-answers.html',
                    bodyClass: 'faqs-answers'
                },

                privacy: {
                    title: 'Privacy Notice',
                    path: '-/privacy.html',
                    file: 'pages/privacy.html',
                    bodyClass: 'privacy'
                },
                product: {
                    title: 'Product',
                    path: '-/product.html',
                    file: 'pages/product.html',
                    bodyClass: 'product',
                    enter: function() {
                        this.productController.routeEntered();
                    },
                    exit: function() {
                        this.productController.routeExited();
                    }
                },
                learnAbout: {
                    title: 'Learn - Learn More About Life Insurance',
                    path: '-/learn-about.html',
                    file: 'pages/learn-about.html',
                    bodyClass: 'learn-about',
                    enter: function() {
                        this.learnController.routeEntered();
                    },
                    exit: function () {
                        this.learnController.routeExited();
                    }
                },
                learnApply: {
                    title: 'Learn - Simple To Apply',
                    path: '-/learn-apply.html',
                    file: 'pages/learn-apply.html',
                    bodyClass: 'learn-apply',
                    enter: function() {
                        this.learnController.routeEntered();
                    },
                    exit: function () {
                        this.learnController.routeExited();
                    }
                },
                learnCoverage: {
                    title: 'Learn - Coverage to Fit Your Budget',
                    path: '-/learn-coverage.html',
                    file: 'pages/learn-coverage.html',
                    bodyClass: 'learn-coverage',
                    enter: function() {
                        this.learnController.routeEntered();
                    },
                    exit: function () {
                        this.learnController.routeExited();
                    }
                },
                learnCurrent: {
                    title: 'Learn - Keep It Current',
                    path: '-/learn-current.html',
                    file: 'pages/learn-current.html',
                    bodyClass: 'learn-current',
                    enter: function() {
                        this.learnController.routeEntered();
                    },
                    exit: function () {
                        this.learnController.routeExited();
                    }
                },
                learnOptions: {
                    title: 'Learn - Two Simple Options',
                    path: '-/learn-options.html',
                    file: 'pages/learn-options.html',
                    bodyClass: 'learn-options',
                    enter: function() {
                        this.learnController.routeEntered();
                    },
                    exit: function () {
                        this.learnController.routeExited();
                    }
                },
                terms: {
                    title: 'Terms of Use',
                    path: '-/terms.html',
                    file: 'pages/terms.html',
                    bodyClass: 'terms'
                },
                '404': {
                    title: 'Error 404',
                    path: '-/404.html',
                    file: 'pages/404.html',
                    bodyClass: 'x404'
                },
                videoTest: {
                    path: '-/video-test.html',
                    file: 'pages/video-test.html'
                },
                learnVideoTest: {
                    path: '-/learn-video-test.html',
                    file: 'pages/learn-video-test.html'
                },
                createAccount: {
                    path: 'create-account',
                    file: 'pages/app-create-account.html',
                    bodyClass: 'app-create-account',
                    enter: function () {
                        this.createAccountController.routeEntered();
                    },
                    exit: function () {
                        this.createAccountController.routeExited();
                    }
                },
                dialog: {
                    enter: function () {
                        this.clearErrorMessages();
                    },
                    routes: {
                        login: {
                            nested: true,
                            popup: 'partials/modals/login.html'
                        },
                        createAccount: {
                            path: 'create-account',
                            nested: true,
                            popup: 'partials/modals/create-account.html',
                            file: 'pages/quote-results.html'
                        },
                        forgotPassword: {
                            path: 'forgot-password',
                            nested: true,
                            popup: 'partials/modals/forgot-password.html'
                        },
                        forgotPasswordInfo: {
                            path: 'forgot-password-info',
                            nested: true,
                            popup: 'partials/modals/forgot-password-info.html'
                        },
                        noAccount: {
                            path: 'no-account',
                            nested: true,
                            popup: 'partials/modals/no-account.html'
                        },
                        notifyStateAvailable: {
                            path: 'notify-state-available',
                            nested: true,
                            file: 'pages/quote.html',
                            popup: 'partials/modals/notify-state-available.html'
                        },
                        invalid_state_appl: {
                            path: 'invalid-state',
                            nested: true,
                            popup: 'partials/modals/invalid-state.html'
                        },
                        cannot_sell_policy: {
                            path: 'cannot-sell-policy',
                            nested: true,
                            popup: 'partials/modals/cannot-sell-policy.html'
                        },
                        registrationConfirmation: {
                            path: 'registration-confirmation',
                            nested: true,
                            popup: 'partials/modals/registration-confirmation.html'
                        },
                        loginNewEmail: {
                            nested: true,
                            popup: 'partials/modals/login-new-email.html'
                        },
                        changePasswordFromReset: {
                            nested: true,
                            popup: 'partials/modals/change-password.html'
                        }
                    }
                }
            }
        }
    }
};
