// For testing number of assessments

var output_file = "assessments-1example.csv";
var output_handle = webpplCsv.openFile(output_file);
webpplCsv.writeLine(output_handle, "trialNum, NumAssessments, target, IG, noisyStudents, scoreAboveBaseline");


var results = mapN(function(trialNum){

  var studentsArray = generateStudentsArray(100);
  var sortedStudents = sortStudents(studentsArray);

  var teacherMusMapping = map(function(mu){

    var teacherAlpha = mu*10;
    var teacherBeta = teacherNu - teacherAlpha;

    var targetParams = {alpha: teacherAlpha, beta: teacherBeta};

    var numAssessmentsMapping = map(function(numAssessments){

      var noisyStudents = updateStudentGuesses(sortedStudents, numAssessments);
      var sortedNoisyStudents = sortNoisyStudents(noisyStudents);
      var trueIG = Math.sum(getAdminIG(sortedStudents, 10, targetParams, 1));
      var noisyIG = Math.sum(getAdminNoisyIG(sortedNoisyStudents, 10, targetParams, 1));
      

      webpplCsv.writeLine(output_handle, trialNum+"," +numAssessments+"," + mu+"," + trueIG+",true,0");
      webpplCsv.writeLine(output_handle, trialNum+"," +numAssessments+"," + mu+"," + noisyIG+",noisy,0");
      return true;

    }, numAssessments);
  }, teacherMus);

}, 100);