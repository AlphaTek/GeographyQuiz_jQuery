let GeoQuiz = {};//the application module/object; let is similar to var to set variables

(function (app, src) {

    let trueFalse_template, mcq_template, shortAnswer_template;
    let rightAnswer_template, wrongAnswer_template, noAnswer_template;
    let results_template;

    app.init = function () {
        app.compileTemplates(); // creating functions
        app.loadQuiz(); // create the quiz on the page
        app.setupBindings();
    };

    app.compileTemplates = function () {
        trueFalse_template = Handlebars.compile($("#trueFalse-template").html());
        mcq_template = Handlebars.compile($("#mcq-template").html());
        shortAnswer_template = Handlebars.compile($("#shortAnswer-template").html());
        rightAnswer_template = Handlebars.compile($("#rightAnswer-template").html());
        wrongAnswer_template = Handlebars.compile($("#wrongAnswer-template").html());
        noAnswer_template = Handlebars.compile($("#noAnswer-template").html());
        results_template = Handlebars.compile($("#summaryOfResult-template").html());
    };

    app.loadQuiz = function () {
        $.getJSON(src, function (quiz) {
            app.quiz = quiz;
            app.loadQuizTemplates(quiz);
            app.numberQuizQuestions();
            app.loadAnswers();
            app.refreshQuizPage();
        });
    };

    app.loadQuizTemplates = function (quiz) {
        $("div.tf-section").html(trueFalse_template(quiz));
        $("div.mcq-section").html(mcq_template(quiz));
        $("div.sa-section").html(shortAnswer_template(quiz));
    };

    app.numberQuizQuestions = function () {
        $("#quiz_page span.questionNumber").each(function (ind) {
            $(this).text(ind + 1);
        });
    };

    app.loadAnswers = function () {
        const saved_answers = localStorage['QuizSavedAnswers'];
        if (saved_answers) {
            let answers = JSON.parse(saved_answers);
            answers.checked_radio_ids.forEach(function (elem) {
                $("#" + elem).prop('checked', true);
            });
            answers.text_input_values.forEach(function (elem) {
                $("#" + elem.id).val(elem.value);
            });
        }
    };

    app.refreshQuizPage = function () {
        $("fieldset[data-role=controlgroup]").controlgroup();
        $("input[type=text]").textinput();
    };

    app.setupBindings = function () {
        $("#save_answers").on("tap", function () {
            app.saveAnswers();
            $.mobile.changePage("#saved_dialog", {transition: "flip"});
        });
        $("#clear_answers").on("tap", function () {
            app.clearAnswers();
            $.mobile.changePage("#cleared_dialog", {transition: "flip"});
        });
        $("#grade_answers").on("tap", function(){
            app.gradeAnswers();
            app.numberGradingQuestions();
            $.mobile.changePage("#grading_page", {transition: "flow"});
        });
    };

    app.saveAnswers = function () {
        let checked_radio_ids = [];
        $("input[type='radio']:checked").each(function () {
            checked_radio_ids.push($(this).attr("id"));
        });
        let text_input_values = [];
        $("input[type='text']").each(function () {
            text_input_values.push({id: $(this).attr("id"), value: $(this).val()});
        });
        localStorage['QuizSavedAnswers'] = JSON.stringify(
            {checked_radio_ids: checked_radio_ids, text_input_values: text_input_values});
    };

    app.clearAnswers = function () {
        $("input[type='radio']:checked").prop('checked', false).checkboxradio("refresh");
        $("input[type='text']").val("");
        localStorage.removeItem('QuizSavedAnswers');
    };

    app.gradeAnswers = function () {
        let $grading_section = $("div.grading-section");
        let $summary_section = $("div.summary-section");
        let skipped_questions_count = 0, right_answers_count = 0, wrong_answers_count = 0;
        let question_ind = 0;
        $grading_section.text('');
        $("div.tf-section fieldset").each(function () {
            let $checked = $(this).find("input[type='radio']:checked");
            let question = app.quiz.TF[question_ind];
            let correct_answer = question.answer;
            let template_data = {text: question.text, correct_answer: correct_answer};
            let html_append;
            if ($checked.length > 0) {
                let user_answer = ($checked.val() === "true");
                if( user_answer === correct_answer){
                    right_answers_count++;
                    html_append = rightAnswer_template(template_data);
                }else{
                    template_data.user_answer = user_answer;
                    wrong_answers_count++;
                    html_append = wrongAnswer_template(template_data);
                }
            }else{
                skipped_questions_count++;
                html_append = noAnswer_template(template_data);
            }
            $grading_section.append(html_append);
            question_ind++;
        });
        question_ind = 0;
        $("div.mcq-section fieldset").each(function () {
            let $checked = $(this).find("input[type='radio']:checked");
            let question = app.quiz.MCQ[question_ind];
            let correct_answer = question.answer;
            let template_data = {text: question.text, correct_answer: correct_answer};
            let html_append;
            if ($checked.length > 0) {
                let user_answer = $checked.val();
                if( user_answer === correct_answer){
                    right_answers_count++;
                    html_append = rightAnswer_template(template_data);
                }else{
                    wrong_answers_count++;
                    template_data.user_answer = user_answer;
                    html_append = wrongAnswer_template(template_data);
                }
            }else{
                skipped_questions_count++;
                html_append = noAnswer_template(template_data);
            }
            $grading_section.append(html_append);
            question_ind++;
        });
        question_ind = 0;
        $("div.sa-section input[type='text']").each(function () {
            let question = app.quiz.SA[question_ind];
            let correct_answer = question.answer;
            let template_data = {text: question.text, correct_answer: correct_answer};
            let html_append;
            let user_answer = $(this).val().trim();
            if (user_answer.length > 0) {
                if( user_answer === correct_answer){
                    right_answers_count++;
                    html_append = rightAnswer_template(template_data);
                }else{
                    wrong_answers_count++;
                    template_data.user_answer = user_answer;
                    html_append = wrongAnswer_template(template_data);
                }
            }else{
                skipped_questions_count++;
                html_append = noAnswer_template(template_data);
            }
            $grading_section.append(html_append);
            question_ind++;
        });
        let questions_count = app.quiz.TF.length + app.quiz.MCQ.length + app.quiz.SA.length;
        let template_data = {
            right_answers_count: right_answers_count,
            wrong_answers_count: wrong_answers_count,
            questions_count: questions_count
        };
        if(skipped_questions_count > 0){
            template_data.skipped_questions_count = skipped_questions_count;
        }
        $summary_section.html(results_template(template_data));
    };

    app.numberGradingQuestions = function () {
        $("#grading_page span.questionNumber").each(function (ind) {
            $(this).text(ind + 1);
        });
    };

    $(document).on("pagecreate", "#quiz_page", function () {
        app.init();
    });

})(GeoQuiz, "quiz.json");